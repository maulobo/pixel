# Cotizador Dinámico (Trade-In desde Sheets) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los datos hardcodeados de `tradein.ts` por dos tablas en Supabase (`tradein_modelos`, `tradein_ajustes`) editables desde Google Sheets, y agregar el paso de batería como 4to factor en el widget.

**Architecture:** Dos nuevas tablas Supabase se sincronizan desde Sheets vía Apps Script. Al iniciar la app, `fetchTradeInData()` carga los datos junto al catálogo. `tradein.ts` se convierte en utilidades puras que reciben los datos como parámetro. `TradeInWidget` agrega un 4to step (batería) usando los datos dinámicos del store.

**Tech Stack:** Supabase (PostgREST), Google Apps Script, React, Zustand, TypeScript, Vite

---

## File Map

| Archivo | Cambio |
|---|---|
| `supabase/schema.sql` | Agregar tablas `tradein_modelos`, `tradein_ajustes` + RLS |
| `scripts/sheets-setup-pixel.gs` | Agregar sync de `cotizador_modelos` y `cotizador_ajustes` |
| `src/lib/tradein.ts` | Reescribir: tipos + funciones puras que reciben `TradeinData` |
| `src/lib/supabase.ts` | Agregar `fetchTradeInData()` |
| `src/store/catalogStore.ts` | Agregar `tradeinData` state; `bateria` a `TradeIn` |
| `src/App.tsx` | Incluir `fetchTradeInData()` en el Promise.all inicial |
| `src/components/TradeInWidget.tsx` | 4to step batería; datos dinámicos del store |
| `src/lib/whatsapp.ts` | Agregar `bateria` al mensaje de WhatsApp |

---

## Task 1: Tablas Supabase

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Agregar las dos tablas al schema**

En `supabase/schema.sql`, antes del bloque `-- ─── RLS ─────`:

```sql
CREATE TABLE IF NOT EXISTS tradein_modelos (
  client_id   UUID     NOT NULL,
  modelo      TEXT     NOT NULL,
  precio_base NUMERIC  NOT NULL,
  PRIMARY KEY (modelo, client_id)
);

CREATE TABLE IF NOT EXISTS tradein_ajustes (
  client_id     UUID     NOT NULL,
  tipo          TEXT     NOT NULL,
  nombre        TEXT     NOT NULL,
  multiplicador NUMERIC  NOT NULL,
  orden         INTEGER  DEFAULT 0,
  PRIMARY KEY (tipo, nombre, client_id)
);
```

Y al final del bloque RLS, agregar:

```sql
ALTER TABLE tradein_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradein_ajustes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read" ON tradein_modelos;
DROP POLICY IF EXISTS "anon read" ON tradein_ajustes;
CREATE POLICY "anon read" ON tradein_modelos FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON tradein_ajustes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "authenticated read" ON tradein_modelos;
DROP POLICY IF EXISTS "authenticated read" ON tradein_ajustes;
CREATE POLICY "authenticated read" ON tradein_modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON tradein_ajustes FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Abrir Supabase > SQL Editor y pegar exactamente:

```sql
CREATE TABLE IF NOT EXISTS tradein_modelos (
  client_id   UUID     NOT NULL,
  modelo      TEXT     NOT NULL,
  precio_base NUMERIC  NOT NULL,
  PRIMARY KEY (modelo, client_id)
);

CREATE TABLE IF NOT EXISTS tradein_ajustes (
  client_id     UUID     NOT NULL,
  tipo          TEXT     NOT NULL,
  nombre        TEXT     NOT NULL,
  multiplicador NUMERIC  NOT NULL,
  orden         INTEGER  DEFAULT 0,
  PRIMARY KEY (tipo, nombre, client_id)
);

ALTER TABLE tradein_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradein_ajustes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read" ON tradein_modelos;
DROP POLICY IF EXISTS "anon read" ON tradein_ajustes;
CREATE POLICY "anon read" ON tradein_modelos FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON tradein_ajustes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "authenticated read" ON tradein_modelos;
DROP POLICY IF EXISTS "authenticated read" ON tradein_ajustes;
CREATE POLICY "authenticated read" ON tradein_modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON tradein_ajustes FOR SELECT TO authenticated USING (true);
```

Verificar: ambas tablas aparecen en Table Editor sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add tradein_modelos and tradein_ajustes tables to schema"
```

---

## Task 2: Apps Script — Sync de Cotizador

**Files:**
- Modify: `scripts/sheets-setup-pixel.gs`

- [ ] **Step 1: Agregar cotizador a SYNCABLE**

Cambiar la línea 14:

```js
var SYNCABLE = ["modelos", "unidades", "config", "categorias", "paleta", "cotizador_modelos", "cotizador_ajustes"];
```

- [ ] **Step 2: Agregar syncCotizador() y conectarlo a runSync y syncAll**

Al final del archivo (después de `syncPaleta`), agregar:

```js
function syncCotizador() {
  syncTable("tradein_modelos", "modelo");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cotizador_ajustes");
  if (!sheet || sheet.getLastRow() < 2) return;

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) { return String(h).trim().toLowerCase(); });

  var rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  var tipoIdx = headers.indexOf("tipo");
  var nombreIdx = headers.indexOf("nombre");
  var seen = {};
  var data = [];

  for (var i = 0; i < rows.length; i++) {
    var tipo = String(rows[i][tipoIdx]).trim();
    var nombre = String(rows[i][nombreIdx]).trim();
    if (!tipo || !nombre) continue;
    var key = tipo + "|" + nombre;
    if (seen[key]) continue;
    seen[key] = true;

    var obj = { client_id: CLIENT_ID, orden: i };
    headers.forEach(function (h, idx) {
      if (!h) return;
      var val = rows[i][idx];
      obj[h] = val === "" || val === undefined ? null : val;
    });
    data.push(obj);
  }

  deleteTable("tradein_ajustes");
  insertTable("tradein_ajustes", data);
}
```

En `syncAll()`, agregar al final del body:

```js
function syncAll() {
  syncModelosYUnidades();
  syncConfig();
  syncCategorias();
  syncPaleta();
  syncCotizador();
}
```

En `runSync()`, agregar al final del body (antes del cierre de función):

```js
  if (pending["cotizador_modelos"] || pending["cotizador_ajustes"]) syncCotizador();
```

- [ ] **Step 3: Verificar en Apps Script Editor**

Abrir el editor de Apps Script y ejecutar `syncCotizador` manualmente. Debe terminar sin error (aunque las hojas no existan todavía, simplemente retorna sin hacer nada).

- [ ] **Step 4: Commit**

```bash
git add scripts/sheets-setup-pixel.gs
git commit -m "feat: add cotizador sync to Apps Script"
```

---

## Task 3: Reescribir tradein.ts con tipos y funciones puras

**Files:**
- Modify: `src/lib/tradein.ts`

- [ ] **Step 1: Reemplazar el contenido completo de tradein.ts**

```typescript
export interface TradeinModelo {
  modelo: string;
  precio_base: number;
}

export interface TradeinAjuste {
  tipo: string;
  nombre: string;
  multiplicador: number;
  orden: number;
}

export interface TradeinData {
  modelos: TradeinModelo[];
  ajustes: TradeinAjuste[];
}

export function getModelos(data: TradeinData): string[] {
  return data.modelos.map((m) => m.modelo);
}

export function getAjusteOptions(data: TradeinData, tipo: string): string[] {
  return data.ajustes
    .filter((a) => a.tipo === tipo)
    .sort((a, b) => a.orden - b.orden)
    .map((a) => a.nombre);
}

export function cotizar(
  data: TradeinData,
  modelo: string,
  storage: string,
  condicion: string,
  bateria: string,
): number {
  const modeloData = data.modelos.find((m) => m.modelo === modelo);
  if (!modeloData) return 0;

  const getMult = (tipo: string, nombre: string) =>
    data.ajustes.find((a) => a.tipo === tipo && a.nombre === nombre)?.multiplicador ?? 0;

  const storageMult = getMult("storage", storage);
  const condicionMult = getMult("condicion", condicion);
  const bateriaMult = getMult("bateria", bateria);

  if (!storageMult || !condicionMult || !bateriaMult) return 0;

  return Math.round(modeloData.precio_base * storageMult * condicionMult * bateriaMult);
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1 | head -30
```

Esperado: errores en los archivos que todavía importan los exports viejos (`IPHONE_MODELOS`, `STORAGE_OPTIONS`, etc.) — eso es correcto, se arreglan en los pasos siguientes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tradein.ts
git commit -m "refactor: rewrite tradein.ts as pure functions with TradeinData type"
```

---

## Task 4: supabase.ts — fetchTradeInData

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Agregar import del tipo**

Al inicio de `src/lib/supabase.ts`, agregar al import existente de tipos:

```typescript
import type { TradeinData, TradeinModelo, TradeinAjuste } from "../lib/tradein";
```

- [ ] **Step 2: Agregar fetchTradeInData al final del archivo**

```typescript
export async function fetchTradeInData(): Promise<TradeinData> {
  const [modelosRes, ajustesRes] = await Promise.all([
    supabase
      .from("tradein_modelos")
      .select("modelo, precio_base")
      .eq("client_id", CLIENT_ID),
    supabase
      .from("tradein_ajustes")
      .select("tipo, nombre, multiplicador, orden")
      .eq("client_id", CLIENT_ID)
      .order("orden"),
  ]);

  return {
    modelos: (modelosRes.data ?? []) as TradeinModelo[],
    ajustes: (ajustesRes.data ?? []) as TradeinAjuste[],
  };
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin nuevos errores en `supabase.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add fetchTradeInData to supabase client"
```

---

## Task 5: catalogStore — tradeinData + bateria en TradeIn

**Files:**
- Modify: `src/store/catalogStore.ts`

- [ ] **Step 1: Agregar import y actualizar interfaces**

Agregar el import al inicio:

```typescript
import type { TradeinData } from "../lib/tradein";
```

Cambiar la interface `TradeIn` (actualmente en línea 15):

```typescript
interface TradeIn {
  modelo: string;
  storage: string;
  condicion: string;
  bateria: string;
  valor: number;
}
```

Agregar a `CatalogStore` (después de `tradeIn: TradeIn | null;`):

```typescript
  tradeinData: TradeinData | null;
  setTradeinData: (data: TradeinData) => void;
```

- [ ] **Step 2: Agregar estado inicial y acción en el store**

En el objeto inicial del store (después de `tradeIn: null,`):

```typescript
      tradeinData: null,
```

Después de `clearTradeIn: () => set({ tradeIn: null }),`:

```typescript
      setTradeinData: (data) => set({ tradeinData: data }),
```

- [ ] **Step 3: Verificar tipos**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1 | head -40
```

Esperado: errores en `TradeInWidget.tsx` y `whatsapp.ts` por `bateria` faltante — se arreglan después.

- [ ] **Step 4: Commit**

```bash
git add src/store/catalogStore.ts
git commit -m "feat: add tradeinData state and bateria field to TradeIn in store"
```

---

## Task 6: App.tsx — cargar tradeinData al inicio

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Agregar import y uso en App.tsx**

Agregar `fetchTradeInData` al import de supabase (línea 4):

```typescript
import { fetchCatalog, fetchConfig, fetchCategorias, fetchTradeInData } from "./lib/supabase";
```

Agregar `setTradeinData` al bloque de selectors del store (después de `setError`):

```typescript
  const setTradeinData = useCatalogStore((s) => s.setTradeinData);
```

Cambiar el `Promise.all` (línea 29) para incluir `fetchTradeInData()`:

```typescript
    Promise.all([fetchCatalog(), fetchConfig(), fetchCategorias(), fetchTradeInData()])
      .then(([catalog, config, categorias, tradeinData]) => {
        setCatalog(catalog);
        setConfig({ ...config, categorias });
        setTradeinData(tradeinData);
        if (config.color_primario) {
          document.documentElement.style.setProperty("--primary", config.color_primario);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
```

Agregar `setTradeinData` al array de dependencias del `useEffect`:

```typescript
  }, [setCatalog, setConfig, setLoading, setError, setTradeinData]);
```

- [ ] **Step 2: Verificar tipos**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin errores nuevos en `App.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: fetch tradein data on app startup"
```

---

## Task 7: whatsapp.ts — agregar bateria al mensaje

**Files:**
- Modify: `src/lib/whatsapp.ts`

- [ ] **Step 1: Actualizar el tipo del parámetro tradeIn**

En `buildCartWhatsAppUrl`, cambiar el tipo del parámetro `tradeIn` (línea 20):

```typescript
  tradeIn?: { modelo: string; storage: string; condicion: string; bateria: string; valor: number } | null,
```

- [ ] **Step 2: Actualizar la línea del mensaje de trade-in**

Cambiar (línea 47):

```typescript
      `iPhone a dar en parte de pago: ${tradeIn.modelo} ${tradeIn.storage} · ${tradeIn.condicion} · Batería ${tradeIn.bateria} (−$${tradeIn.valor.toLocaleString("es-AR")})`,
```

- [ ] **Step 3: Verificar tipos**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/whatsapp.ts
git commit -m "feat: include bateria in trade-in WhatsApp message"
```

---

## Task 8: TradeInWidget — datos dinámicos + 4to paso batería

**Files:**
- Modify: `src/components/TradeInWidget.tsx`

- [ ] **Step 1: Reemplazar imports de tradein**

Cambiar los imports del top del archivo de:

```typescript
import {
  IPHONE_MODELOS,
  STORAGE_OPTIONS,
  CONDICION_OPTIONS,
  cotizar,
} from "../lib/tradein";
```

A:

```typescript
import { getModelos, getAjusteOptions, cotizar } from "../lib/tradein";
```

- [ ] **Step 2: Obtener tradeinData del store y derivar listas**

Al inicio de la función `TradeInWidget`, después de `const clearTradeIn = ...`:

```typescript
  const tradeinData = useCatalogStore((s) => s.tradeinData);

  const IPHONE_MODELOS = tradeinData ? getModelos(tradeinData) : [];
  const STORAGE_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "storage") : [];
  const CONDICION_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "condicion") : [];
  const BATERIA_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "bateria") : [];
```

- [ ] **Step 3: Agregar estado de batería**

Después de `const [condicion, setCondicion] = useState("");`:

```typescript
  const [bateria, setBateria] = useState("");
```

- [ ] **Step 4: Actualizar flags de progreso**

Cambiar (buscar `const hasCondicion`):

```typescript
  const hasCondicion = Boolean(condicion);
  const hasBateria = Boolean(bateria);
  const allSelected = hasModelo && hasStorage && hasCondicion && hasBateria;
  const valor = allSelected && tradeinData ? cotizar(tradeinData, modelo, storage, condicion, bateria) : 0;
```

- [ ] **Step 5: Actualizar handlers para resetear batería**

En `handleModeloChange`:

```typescript
  function handleModeloChange(nextModelo: string) {
    setModelo(nextModelo);
    setStorage("");
    setCondicion("");
    setBateria("");
  }
```

En `handleStorageChange`:

```typescript
  function handleStorageChange(nextStorage: string) {
    setStorage(nextStorage);
    setCondicion("");
    setBateria("");
  }
```

Agregar `handleCondicionChange`:

```typescript
  function handleCondicionChange(nextCondicion: string) {
    setCondicion(nextCondicion);
    setBateria("");
  }
```

En `handleCambiar`:

```typescript
  function handleCambiar() {
    clearTradeIn();
    setModelo("");
    setStorage("");
    setCondicion("");
    setBateria("");
  }
```

- [ ] **Step 6: Actualizar handleAplicar para incluir bateria**

```typescript
  function handleAplicar() {
    if (!allSelected || valor === 0) return;
    setTradeIn({ modelo, storage, condicion, bateria, valor });
  }
```

- [ ] **Step 7: Actualizar el StepMarker de progreso (header del widget)**

Cambiar el bloque de markers (buscar `<StepMarker index={1}` en el header) para agregar el 4to:

```tsx
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <StepMarker index={1} active={!hasModelo} done={hasModelo} />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker index={2} active={hasModelo && !hasStorage} done={hasStorage} />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker
              index={3}
              active={hasModelo && hasStorage && !hasCondicion}
              done={hasCondicion}
            />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker
              index={4}
              active={hasModelo && hasStorage && hasCondicion && !hasBateria}
              done={hasBateria}
            />
          </div>
```

- [ ] **Step 8: Cambiar onClick del step 3 (condicion) para usar handleCondicionChange**

Buscar `onClick={() => setCondicion(item)}` y cambiar a:

```tsx
                      onClick={() => handleCondicionChange(item)}
```

- [ ] **Step 9: Agregar StepCard 4 (batería) después del StepCard 3**

Después del cierre del `StepCard` de condicion (busca `</StepCard>` que contiene `CONDICION_OPTIONS`):

```tsx
              <StepCard
                index={4}
                title="Estado de batería"
                hint="El porcentaje de salud de la batería ajusta el valor final."
                active={hasModelo && hasStorage && hasCondicion && !hasBateria}
                done={hasBateria}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BATERIA_OPTIONS.map((item) => (
                    <ChoiceButton
                      key={item}
                      label={item}
                      disabled={!hasCondicion}
                      selected={bateria === item}
                      onClick={() => setBateria(item)}
                    />
                  ))}
                </div>
              </StepCard>
```

- [ ] **Step 10: Actualizar el panel "Parte de pago aplicada" para mostrar batería**

Buscar `{tradeIn.storage} · {tradeIn.condicion}` y cambiar a:

```tsx
                    {tradeIn.storage} · {tradeIn.condicion} · Batería {tradeIn.bateria}
```

- [ ] **Step 11: Agregar batería al panel Resumen**

Después del bloque de `Estado` en el panel aside, agregar:

```tsx
                <div className="rounded-[1.1rem] border border-white/85 bg-white/75 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Batería
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {bateria || "Pendiente"}
                  </p>
                </div>
```

- [ ] **Step 12: Verificar tipos y compilación**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit 2>&1
```

Esperado: 0 errores.

- [ ] **Step 13: Verificar visualmente en dev server**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm dev
```

Abrir `http://localhost:5173`. Verificar:
- El widget muestra 4 pasos
- Si `tradeinData` es null (tablas vacías), los selects están vacíos pero no rompen
- Los tipos compilan sin error

- [ ] **Step 14: Commit**

```bash
git add src/components/TradeInWidget.tsx
git commit -m "feat: add battery step to TradeInWidget with dynamic cotizador data"
```

---

## Task 9: Crear las hojas en Google Sheets

No hay código para este task — es configuración manual del Sheet.

- [ ] **Step 1: Crear hoja `cotizador_modelos`**

Nueva hoja llamada exactamente `cotizador_modelos` con headers en fila 1:

```
modelo | precio_base
```

Cargar los datos iniciales (copiar desde `tradein.ts` original antes de borrarlo):

| modelo | precio_base |
|---|---|
| iPhone X | 120000 |
| iPhone XR | 140000 |
| iPhone XS | 160000 |
| iPhone XS Max | 180000 |
| iPhone 11 | 200000 |
| iPhone 11 Pro | 260000 |
| iPhone 11 Pro Max | 290000 |
| iPhone 12 | 300000 |
| iPhone 12 Mini | 270000 |
| iPhone 12 Pro | 370000 |
| iPhone 12 Pro Max | 420000 |
| iPhone 13 | 420000 |
| iPhone 13 Mini | 370000 |
| iPhone 13 Pro | 520000 |
| iPhone 13 Pro Max | 580000 |
| iPhone 14 | 560000 |
| iPhone 14 Plus | 610000 |
| iPhone 14 Pro | 720000 |
| iPhone 14 Pro Max | 800000 |
| iPhone 15 | 720000 |
| iPhone 15 Plus | 790000 |
| iPhone 15 Pro | 900000 |
| iPhone 15 Pro Max | 1000000 |

- [ ] **Step 2: Crear hoja `cotizador_ajustes`**

Nueva hoja llamada exactamente `cotizador_ajustes` con headers en fila 1:

```
tipo | nombre | multiplicador | orden
```

Cargar:

| tipo | nombre | multiplicador | orden |
|---|---|---|---|
| storage | 64GB | 0.92 | 0 |
| storage | 128GB | 1.00 | 1 |
| storage | 256GB | 1.10 | 2 |
| storage | 512GB | 1.22 | 3 |
| storage | 1TB | 1.35 | 4 |
| condicion | Excelente | 1.00 | 0 |
| condicion | Bueno | 0.78 | 1 |
| condicion | Regular | 0.55 | 2 |
| condicion | Roto | 0.25 | 3 |
| bateria | 90-100% | 1.00 | 0 |
| bateria | 80-89% | 0.90 | 1 |
| bateria | 70-79% | 0.78 | 2 |
| bateria | <70% | 0.60 | 3 |

- [ ] **Step 3: Sincronizar desde el menú Pixel**

En Google Sheets: Pixel → 🔄 Sincronizar todo ahora

Verificar en Supabase Table Editor que `tradein_modelos` tiene 23 filas y `tradein_ajustes` tiene 13 filas.

---

## Task 10: Verificación end-to-end

- [ ] **Step 1: Abrir el dev server con tablas cargadas**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm dev
```

- [ ] **Step 2: Verificar el widget completo**

1. Ir a `/` (homepage), scroll al TradeInWidget
2. Seleccionar modelo → aparecen opciones de storage
3. Seleccionar storage → aparecen opciones de condicion
4. Seleccionar condicion → aparece el step 4 de batería
5. Seleccionar batería → aparece el precio calculado
6. Precio calculado == `precio_base × mult_storage × mult_condicion × mult_bateria`
   - Ejemplo: iPhone 13 / 128GB / Excelente / 90-100% = 420000 × 1.0 × 1.0 × 1.0 = **$420.000**
   - Ejemplo: iPhone 13 / 256GB / Bueno / 80-89% = 420000 × 1.1 × 0.78 × 0.90 = **$324.324**
7. Click "Aplicar al carrito" → muestra confirmación con modelo, storage, condicion, batería
8. Ir a carrito → aparece la deducción del trade-in
9. Abrir WhatsApp → el mensaje incluye `Batería 90-100%`

- [ ] **Step 3: Verificar con tablas vacías (fallback)**

Temporalmente vaciar `tradein_modelos` en Supabase. Recargar la app. El widget debe renderizar sin romper — los selects aparecen vacíos, no hay crash.

Restaurar los datos.
