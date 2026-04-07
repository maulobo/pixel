# Variant Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agrupar unidades del mismo modelo en una sola card en el catálogo y agregar un selector de variantes (color/capacidad) en la página de detalle.

**Architecture:** Se añade el tipo `ModeloGroup` en `types/index.ts`. `CatalogPage` agrupa el catálogo filtrado por `modelo_id` antes de paginar. `DeviceCard` recibe un `ModeloGroup` en lugar de una `UnidadConModelo`. `DetailPage` pasa a usar `modeloId` como param de ruta y maneja `selectedUnidad` como estado local reactivo a las pills de variante.

**Tech Stack:** React 18, TypeScript, Zustand, React Router, Tailwind CSS (clases custom via CSS vars), Vite

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/types/index.ts` | Modificar | Añadir tipo `ModeloGroup` |
| `src/pages/CatalogPage.tsx` | Modificar | Agrupar unidades filtradas por modelo, paginar sobre grupos |
| `src/components/DeviceCard.tsx` | Reescribir | Recibir `ModeloGroup`, mostrar pills de variantes y precio mínimo |
| `src/pages/DetailPage.tsx` | Reescribir | Ruta por `modeloId`, selector de variantes reactivo |
| `src/App.tsx` | Modificar | Cambiar ruta de `:unidadId` a `:modeloId` |

---

## Task 1: Añadir tipo `ModeloGroup`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Añadir el tipo al final del archivo**

Abrir `src/types/index.ts` y agregar al final:

```ts
export interface ModeloGroup {
  modelo: Modelo;
  unidades: UnidadConModelo[];
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit
```

Esperado: sin errores (o los mismos que había antes de este cambio).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add ModeloGroup type for variant grouping"
```

---

## Task 2: Actualizar `CatalogPage` para agrupar por modelo

**Files:**
- Modify: `src/pages/CatalogPage.tsx`

- [ ] **Step 1: Reemplazar el `useMemo` de `results` con agrupación**

Reemplazar el contenido completo de `src/pages/CatalogPage.tsx`:

```tsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";
import Filters from "../components/Filters";
import DeviceCard from "../components/DeviceCard";
import type { ModeloGroup } from "../types";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const catalog = useCatalogStore((s) => s.catalog);
  const filters = useCatalogStore((s) => s.filters);
  const loading = useCatalogStore((s) => s.loading);
  const setFilter = useCatalogStore((s) => s.setFilter);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const categoria = searchParams.get("categoria") ?? "";
    const condicion = searchParams.get("condicion") ?? "";
    setFilter("categoria", categoria);
    setFilter("condicion", condicion);
    setPage(1);
  }, [searchParams, setFilter]);

  const grouped = useMemo(() => {
    const filtered = catalog.filter((u) => {
      if (filters.categoria && u.modelo.categoria !== filters.categoria) return false;
      if (filters.modelo && u.modelo_id !== filters.modelo) return false;
      if (filters.color && u.color !== filters.color) return false;
      if (u.precio < filters.precioMin || u.precio > filters.precioMax) return false;
      if (filters.bateriaMin > 0 && u.bateria < filters.bateriaMin) return false;
      if (filters.condicion) {
        const state = getCommercialState(u.condicion, u.bateria);
        if (filters.condicion === "__nuevo__" && state !== "nuevo") return false;
        if (filters.condicion === "__usado__" && state !== "usado") return false;
        if (
          filters.condicion !== "__nuevo__" &&
          filters.condicion !== "__usado__" &&
          u.condicion !== filters.condicion
        )
          return false;
      }
      return true;
    });

    const map = new Map<string, ModeloGroup>();
    for (const u of filtered) {
      if (!map.has(u.modelo_id)) {
        map.set(u.modelo_id, { modelo: u.modelo, unidades: [] });
      }
      map.get(u.modelo_id)!.unidades.push(u);
    }
    return Array.from(map.values());
  }, [catalog, filters]);

  const totalPages = Math.ceil(grouped.length / PAGE_SIZE);
  const paginated = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <section className="surface-panel rounded-[2rem] border border-white/80 px-6 py-7 md:px-8 md:py-8 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-2">
              Catalogo activo
            </p>
            <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)]">
              Tecnologia lista para cotizar
            </h1>
            <p className="text-[var(--muted)] mt-3 max-w-2xl">
              Filtra por categoria, estado o precio para responder consultas mas rapido y mostrar opciones concretas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="pill-muted text-[var(--text)]">
              {grouped.length} modelos
            </span>
            <span className="pill-muted text-[var(--text)]">
              Stock actualizado
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <Filters />

        <div className="flex-1">
          {loading ? (
            <div className="surface-card rounded-[1.75rem] text-center py-20 text-[var(--muted)]">
              Cargando...
            </div>
          ) : grouped.length === 0 ? (
            <div className="surface-card rounded-[1.75rem] text-center py-20 text-[var(--muted)]">
              No hay dispositivos con esos filtros.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                <p className="text-sm text-[var(--muted)] font-medium">
                  {grouped.length} modelos
                  {totalPages > 1 && ` · pagina ${page} de ${totalPages}`}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-bold">
                  Seleccion visible para venta inmediata
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map((group) => (
                  <DeviceCard key={group.modelo.modelo_id} group={group} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    ← Anterior
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1,
                      )
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 py-2 text-sm text-[var(--muted)]"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goTo(p as number)}
                            className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                              page === p
                                ? "bg-[var(--primary)] text-white"
                                : "border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                  </div>

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit
```

Esperado: error en `DeviceCard` porque todavía recibe `unidad` — es esperado, se resuelve en Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CatalogPage.tsx
git commit -m "feat: group catalog by modelo_id before rendering"
```

---

## Task 3: Reescribir `DeviceCard` para recibir `ModeloGroup`

**Files:**
- Modify: `src/components/DeviceCard.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del componente**

```tsx
import { Link } from "react-router";
import type { ModeloGroup } from "../types";

interface Props {
  group: ModeloGroup;
}

export default function DeviceCard({ group }: Props) {
  const { modelo, unidades } = group;

  const uniqueColors = [...new Set(unidades.map((u) => u.color).filter(Boolean))];
  const uniqueCapacidades = [...new Set(unidades.map((u) => u.capacidad).filter(Boolean))];
  const minPrecio = Math.min(...unidades.map((u) => u.precio));
  const hasVariants = uniqueColors.length > 1 || uniqueCapacidades.length > 1;

  return (
    <article className="group surface-panel rounded-[1.75rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col animate-rise border border-white/80">
      <Link to={`/catalogo/${modelo.modelo_id}`} className="flex flex-col flex-1">
        <div className="relative bg-gradient-to-br from-[#edf4ff] via-white to-[#dcecff] aspect-square flex items-center justify-center p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[#70d7ff] to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 border border-white font-semibold text-[var(--muted)] uppercase tracking-wide">
              {modelo.categoria}
            </span>
            {unidades.length > 1 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold uppercase tracking-wide">
                {unidades.length} unidades
              </span>
            )}
          </div>
          <img
            src={modelo.imagen_principal}
            alt={modelo.nombre}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/400x400/F5F5F7/6E6E73?text=Sin+imagen";
            }}
          />
        </div>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wide">
              {modelo.categoria}
            </p>
            <h3 className="text-base font-bold text-[var(--text)] leading-tight">
              {modelo.nombre}
            </h3>
          </div>

          {hasVariants && (
            <div className="flex flex-col gap-2">
              {uniqueColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueColors.map((color) => (
                    <span
                      key={color}
                      className="text-xs bg-[#edf2ff] text-[var(--text)] px-2 py-1 rounded-full"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              )}
              {uniqueCapacidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueCapacidades.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs bg-[#f0fdf4] text-[#166534] px-2 py-1 rounded-full font-medium"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasVariants && unidades[0] && (
            <div className="flex flex-wrap gap-1.5 text-xs text-[var(--muted)]">
              {unidades[0].color && (
                <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].color}</span>
              )}
              {unidades[0].capacidad && (
                <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].capacidad}</span>
              )}
              <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].condicion}</span>
            </div>
          )}

          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            <div>
              {unidades.length > 1 && (
                <p className="text-xs text-[var(--muted)] font-medium mb-0.5">desde</p>
              )}
              <p className="text-xl font-extrabold text-[var(--text)]">
                ${minPrecio.toLocaleString("es-AR")}
              </p>
            </div>
            <span className="text-sm font-semibold text-[var(--primary)] group-hover:translate-x-1 transition-transform">
              Ver detalle →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit
```

Esperado: error en `DetailPage` porque todavía usa `:unidadId` — es esperado, se resuelve en Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/DeviceCard.tsx
git commit -m "feat: rebuild DeviceCard to show ModeloGroup with variant pills"
```

---

## Task 4: Reescribir `DetailPage` con selector de variantes

**Files:**
- Modify: `src/pages/DetailPage.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```tsx
import { useParams, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";
import { buildUnitWhatsAppUrl } from "../lib/whatsapp";
import type { UnidadConModelo } from "../types";

function BatteryBar({ value }: { value: number }) {
  if (value === 0) return null;
  const color =
    value >= 85 ? "bg-green-500" : value >= 70 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[var(--muted)]">Estado de bateria</span>
        <span className="font-semibold text-[var(--text)]">{value}%</span>
      </div>
      <div className="h-2 bg-[#dce7ff] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function VariantPills({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
              selected === opt
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white/80 text-[var(--text)] border-[var(--line)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DetailPage() {
  const { modeloId } = useParams();
  const catalog = useCatalogStore((s) => s.catalog);
  const whatsapp = useCatalogStore((s) => s.config?.whatsapp ?? "");
  const cart = useCatalogStore((s) => s.cart);
  const addToCart = useCatalogStore((s) => s.addToCart);
  const removeFromCart = useCatalogStore((s) => s.removeFromCart);
  const openCart = useCatalogStore((s) => s.openCart);

  const units = useMemo(
    () => catalog.filter((u) => u.modelo_id === modeloId),
    [catalog, modeloId],
  );

  const [selectedUnidad, setSelectedUnidad] = useState<UnidadConModelo | null>(null);

  useEffect(() => {
    const cheapest = [...units].sort((a, b) => a.precio - b.precio)[0] ?? null;
    setSelectedUnidad(cheapest);
  }, [modeloId, units]);

  const uniqueColors = useMemo(
    () => [...new Set(units.map((u) => u.color).filter(Boolean))],
    [units],
  );
  const uniqueCapacidades = useMemo(
    () => [...new Set(units.map((u) => u.capacidad).filter(Boolean))],
    [units],
  );

  function selectColor(color: string) {
    const match = units.find(
      (u) => u.color === color && u.capacidad === selectedUnidad?.capacidad,
    );
    if (match) { setSelectedUnidad(match); return; }
    const cheapest = [...units]
      .filter((u) => u.color === color)
      .sort((a, b) => a.precio - b.precio)[0];
    if (cheapest) setSelectedUnidad(cheapest);
  }

  function selectCapacidad(capacidad: string) {
    const match = units.find(
      (u) => u.capacidad === capacidad && u.color === selectedUnidad?.color,
    );
    if (match) { setSelectedUnidad(match); return; }
    const cheapest = [...units]
      .filter((u) => u.capacidad === capacidad)
      .sort((a, b) => a.precio - b.precio)[0];
    if (cheapest) setSelectedUnidad(cheapest);
  }

  if (units.length === 0 || !selectedUnidad) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[var(--muted)]">Dispositivo no encontrado.</p>
        <Link
          to="/catalogo"
          className="text-[var(--primary)] mt-4 inline-block hover:underline"
        >
          {"<-"} Volver al catalogo
        </Link>
      </div>
    );
  }

  const state = getCommercialState(selectedUnidad.condicion, selectedUnidad.bateria);
  const inCart = cart.includes(selectedUnidad.unidad_id);

  function handleCartAction() {
    if (inCart) {
      removeFromCart(selectedUnidad!.unidad_id);
      return;
    }
    addToCart(selectedUnidad!.unidad_id);
    openCart();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <Link
        to="/catalogo"
        className="text-sm text-[var(--primary)] font-semibold hover:underline mb-8 inline-block"
      >
        {"<-"} Volver al catalogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-6">
          <div className="surface-panel rounded-[2.2rem] border border-white/80 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                {selectedUnidad.modelo.categoria}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  state === "nuevo"
                    ? "bg-[#d9ecff] text-[#0066d6]"
                    : "bg-[#eef2f6] text-[#334155]"
                }`}
              >
                {state === "nuevo" ? "Nuevo" : "Usado"}
              </span>
              <span className="inline-flex rounded-full bg-white/80 border border-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Ref. {selectedUnidad.unidad_id}
              </span>
            </div>

            <div className="relative rounded-[1.8rem] bg-gradient-to-b from-[#fbfdff] via-[#edf4ff] to-[#e2eeff] min-h-[360px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.18),transparent_36%)] pointer-events-none" />
              <div className="absolute -top-12 right-[-20px] h-40 w-40 rounded-full bg-[var(--primary)]/12 blur-3xl" />
              <div className="absolute -bottom-14 left-[-10px] h-44 w-44 rounded-full bg-[#7dd3fc]/18 blur-3xl" />
              <img
                src={selectedUnidad.imagen_url || selectedUnidad.modelo.imagen_principal}
                alt={`${selectedUnidad.modelo.nombre} ${selectedUnidad.color}`}
                className="relative z-10 max-h-[420px] w-full object-contain px-8 drop-shadow-[0_40px_35px_rgba(15,23,42,0.18)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x600/F5F5F7/6E6E73?text=Sin+imagen";
                }}
              />
            </div>
          </div>

          <div className="surface-panel rounded-[1.9rem] border border-white/80 p-6 md:p-7">
            <div className="flex flex-wrap gap-3 mb-5">
              {selectedUnidad.color && (
                <span className="pill-muted text-[var(--text)]">{selectedUnidad.color}</span>
              )}
              {selectedUnidad.capacidad && (
                <span className="pill-muted text-[var(--text)]">{selectedUnidad.capacidad}</span>
              )}
              <span className="pill-muted text-[var(--text)]">{selectedUnidad.condicion}</span>
            </div>

            <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
              Sobre el {selectedUnidad.modelo.nombre}
            </h2>
            <p className="text-[15px] text-[var(--muted)] leading-7 mb-5">
              {selectedUnidad.modelo.descripcion_general}
            </p>

            <div className="rounded-[1.4rem] bg-white/72 border border-white px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold mb-2">
                Especificaciones destacadas
              </p>
              <p className="text-sm text-[var(--text)] leading-7">
                {selectedUnidad.modelo.specs}
              </p>
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 space-y-6">
          <div className="surface-panel rounded-[2rem] border border-white/80 p-6 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-2">
              Seleccion comercial
            </p>
            <h1 className="brand-heading text-4xl md:text-[2.8rem] font-bold text-[var(--text)] leading-[1.02]">
              {selectedUnidad.modelo.nombre}
            </h1>
            <p className="text-lg text-[var(--muted)] mt-3">
              {selectedUnidad.capacidad} · {selectedUnidad.color}
            </p>

            {(uniqueColors.length > 1 || uniqueCapacidades.length > 1) && (
              <div className="mt-5 space-y-4 pb-5 border-b border-[var(--line)]">
                <VariantPills
                  label="Color"
                  options={uniqueColors}
                  selected={selectedUnidad.color}
                  onSelect={selectColor}
                />
                <VariantPills
                  label="Capacidad"
                  options={uniqueCapacidades}
                  selected={selectedUnidad.capacidad}
                  onSelect={selectCapacidad}
                />
              </div>
            )}

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold mb-1">
                  Precio publicado
                </p>
                <p className="text-4xl font-extrabold text-[var(--text)]">
                  ${selectedUnidad.precio.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[#25d366]/12 text-[#128c7e] px-4 py-3 text-sm font-semibold">
                Consulta directa
              </div>
            </div>

            <div className="grid gap-3 mt-6">
              <a
                href={buildUnitWhatsAppUrl(selectedUnidad, whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25d366] text-white text-center font-semibold py-4 rounded-[1.4rem] hover:bg-[#1fb85a] transition-colors flex items-center justify-center gap-2 text-lg shadow-[0_22px_40px_-22px_rgba(37,211,102,0.8)]"
              >
                <WhatsAppIcon />
                Consultar por WhatsApp
              </a>

              <button
                onClick={handleCartAction}
                className={`w-full text-center font-semibold py-4 rounded-[1.4rem] transition-colors text-lg ${
                  inCart
                    ? "bg-[#0f172a] text-white hover:bg-[#111c33]"
                    : "border border-[var(--line)] bg-white/85 text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
              >
                {inCart ? "Quitar del carrito" : "Agregar al carrito"}
              </button>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] border border-white/80 p-6 md:p-7 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-[0.16em]">
                Estado de esta unidad
              </h2>
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
                Lista para cotizar
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[1.3rem] bg-white/76 border border-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold mb-2">
                  Condicion
                </p>
                <p className="text-base font-semibold text-[var(--text)]">
                  {selectedUnidad.condicion}
                </p>
              </div>
              <div className="rounded-[1.3rem] bg-white/76 border border-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold mb-2">
                  Capacidad
                </p>
                <p className="text-base font-semibold text-[var(--text)]">
                  {selectedUnidad.capacidad || "No especificada"}
                </p>
              </div>
            </div>

            <BatteryBar value={selectedUnidad.bateria} />

            {selectedUnidad.descripcion_particular && (
              <div className="rounded-[1.3rem] bg-white/72 border border-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold mb-2">
                  Notas de la unidad
                </p>
                <p className="text-sm text-[var(--text)] leading-relaxed">
                  {selectedUnidad.descripcion_particular}
                </p>
              </div>
            )}

            <div className="rounded-[1.3rem] bg-[#f6fbff] border border-[#dcecff] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold mb-2">
                Sugerencia
              </p>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Si el cliente esta comparando varios equipos, agrega este producto al carrito y envia una sola consulta completa por WhatsApp.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit
```

Esperado: sin errores (salvo posibles errores pre-existentes).

- [ ] **Step 3: Commit**

```bash
git add src/pages/DetailPage.tsx
git commit -m "feat: add variant selector on detail page, use modeloId route param"
```

---

## Task 5: Actualizar ruta en `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Cambiar la ruta del detalle**

En `src/App.tsx`, cambiar la línea:

```tsx
<Route path="/catalogo/:unidadId" element={<DetailPage />} />
```

por:

```tsx
<Route path="/catalogo/:modeloId" element={<DetailPage />} />
```

- [ ] **Step 2: Verificar que compila y levanta**

```bash
cd /Users/maurolobo/SmartCloud/pixel && npx tsc --noEmit
```

Esperado: sin errores.

```bash
cd /Users/maurolobo/SmartCloud/pixel && npm run dev
```

Verificar manualmente en el browser:
- El catálogo muestra una card por modelo con pills de variantes
- Hacer click en una card navega a `/catalogo/:modeloId`
- En el detalle, las pills de color y capacidad cambian precio/batería/condición
- Agregar al carrito desde el detalle funciona con la variante seleccionada

- [ ] **Step 3: Commit final**

```bash
git add src/App.tsx
git commit -m "feat: update catalog route to use modeloId for variant-based detail page"
```
