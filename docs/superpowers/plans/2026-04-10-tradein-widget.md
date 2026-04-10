# Trade-In Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable TradeIn widget that lets users cotizar su iPhone usado como parte de pago, aplica como descuento en el carrito, y aparece en la homepage y en la página de detalle.

**Architecture:** Price table hardcoded in `src/lib/tradein.ts` using base price × storage multiplier × condition multiplier. Trade-in state lives in Zustand (not persisted). Widget is a self-contained card with 3 selects; cart components read the tradeIn value and show it as a deduction line.

**Tech Stack:** React 19, Zustand 5, TypeScript, Tailwind CSS 4

> **Note:** No test framework is configured in this project. TDD steps are skipped — verify each task visually in `pnpm dev`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/tradein.ts` | Price table, constants, `cotizar()` function |
| Modify | `src/store/catalogStore.ts` | Add `tradeIn` state + `setTradeIn` / `clearTradeIn` |
| Create | `src/components/TradeInWidget.tsx` | The 3-select widget card |
| Modify | `src/pages/HomePage.tsx` | Add `<TradeInWidget />` section between categorias and banner usados |
| Modify | `src/pages/DetailPage.tsx` | Add `<TradeInWidget />` below action buttons |
| Modify | `src/components/CartDrawer.tsx` | Show trade-in deduction line + Quitar button |
| Modify | `src/pages/CartPage.tsx` | Show trade-in deduction line + Quitar button in resumen aside |

---

## Task 1: Price library

**Files:**
- Create: `src/lib/tradein.ts`

- [ ] **Step 1: Create `src/lib/tradein.ts`**

```typescript
// Base prices in ARS per model (128GB, Excelente condition as reference)
const BASE_PRICES: Record<string, number> = {
  "iPhone X":         120_000,
  "iPhone XR":        140_000,
  "iPhone XS":        160_000,
  "iPhone XS Max":    180_000,
  "iPhone 11":        200_000,
  "iPhone 11 Pro":    260_000,
  "iPhone 11 Pro Max":290_000,
  "iPhone 12":        300_000,
  "iPhone 12 Mini":   270_000,
  "iPhone 12 Pro":    370_000,
  "iPhone 12 Pro Max":420_000,
  "iPhone 13":        420_000,
  "iPhone 13 Mini":   370_000,
  "iPhone 13 Pro":    520_000,
  "iPhone 13 Pro Max":580_000,
  "iPhone 14":        560_000,
  "iPhone 14 Plus":   610_000,
  "iPhone 14 Pro":    720_000,
  "iPhone 14 Pro Max":800_000,
  "iPhone 15":        720_000,
  "iPhone 15 Plus":   790_000,
  "iPhone 15 Pro":    900_000,
  "iPhone 15 Pro Max":1_000_000,
};

const STORAGE_MULTIPLIER: Record<string, number> = {
  "64GB":  0.92,
  "128GB": 1.00,
  "256GB": 1.10,
  "512GB": 1.22,
  "1TB":   1.35,
};

const CONDICION_MULTIPLIER: Record<string, number> = {
  "Excelente": 1.00,
  "Bueno":     0.78,
  "Regular":   0.55,
  "Roto":      0.25,
};

export const IPHONE_MODELOS = Object.keys(BASE_PRICES);

export const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

export const CONDICION_OPTIONS = ["Excelente", "Bueno", "Regular", "Roto"];

export function cotizar(modelo: string, storage: string, condicion: string): number {
  const base = BASE_PRICES[modelo];
  const storageMult = STORAGE_MULTIPLIER[storage];
  const condicionMult = CONDICION_MULTIPLIER[condicion];
  if (!base || !storageMult || !condicionMult) return 0;
  return Math.round(base * storageMult * condicionMult);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/tradein.ts
git commit -m "feat: add trade-in price library with cotizar() function"
```

---

## Task 2: Zustand state

**Files:**
- Modify: `src/store/catalogStore.ts`

- [ ] **Step 1: Add the TradeIn type and extend the store interface**

In `src/store/catalogStore.ts`, add the `TradeIn` type and extend `CatalogStore`. Insert after the `Filters` interface (around line 14):

```typescript
interface TradeIn {
  modelo: string;
  storage: string;
  condicion: string;
  valor: number;
}
```

In the `CatalogStore` interface, add after `isCartOpen: boolean;` (around line 23):

```typescript
  tradeIn: TradeIn | null;
  setTradeIn: (t: TradeIn) => void;
  clearTradeIn: () => void;
```

- [ ] **Step 2: Add initial state and actions to the store**

In the `create()(persist(...))` call, add initial state after `isCartOpen: false,` (around line 57):

```typescript
      tradeIn: null,
```

Add actions after `toggleCartDrawer: ...` (around line 84):

```typescript
      setTradeIn: (t) => set({ tradeIn: t }),
      clearTradeIn: () => set({ tradeIn: null }),
```

The `partialize` for persist already only saves `cart`, so `tradeIn` won't be persisted — no change needed there.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/catalogStore.ts
git commit -m "feat: add tradeIn state to catalogStore"
```

---

## Task 3: TradeInWidget component

**Files:**
- Create: `src/components/TradeInWidget.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react";
import { useCatalogStore } from "../store/catalogStore";
import {
  IPHONE_MODELOS,
  STORAGE_OPTIONS,
  CONDICION_OPTIONS,
  cotizar,
} from "../lib/tradein";

export default function TradeInWidget() {
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const setTradeIn = useCatalogStore((s) => s.setTradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);

  const [modelo, setModelo] = useState("");
  const [storage, setStorage] = useState("");
  const [condicion, setCondicion] = useState("");

  const allSelected = modelo && storage && condicion;
  const valor = allSelected ? cotizar(modelo, storage, condicion) : 0;

  function handleAplicar() {
    if (!allSelected || valor === 0) return;
    setTradeIn({ modelo, storage, condicion, valor });
  }

  function handleCambiar() {
    clearTradeIn();
    setModelo("");
    setStorage("");
    setCondicion("");
  }

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 backdrop-blur-sm p-6 md:p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.14)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4 4 4" />
            <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Parte de pago
          </p>
          <h3 className="text-lg font-bold text-[var(--text)] leading-tight">
            Cotizá tu iPhone
          </h3>
        </div>
      </div>

      {tradeIn ? (
        <div className="space-y-4">
          <div className="rounded-[1.4rem] bg-[var(--primary)]/8 border border-[var(--primary)]/20 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">
                {tradeIn.modelo} · {tradeIn.storage} · {tradeIn.condicion}
              </p>
              <p className="text-2xl font-extrabold text-[var(--text)] tracking-[-0.03em]">
                −${tradeIn.valor.toLocaleString("es-AR")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f0e8] text-[#0a7a4a] text-xs font-bold px-3 py-1 uppercase tracking-[0.14em]">
              Aplicado
            </span>
          </div>
          <button
            onClick={handleCambiar}
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            Cambiar equipo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Modelo
              </label>
              <select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {IPHONE_MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Almacenamiento
              </label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Estado
              </label>
              <select
                value={condicion}
                onChange={(e) => setCondicion(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {CONDICION_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {allSelected && valor > 0 && (
            <div className="rounded-[1.4rem] bg-[#f0f7ff] border border-[var(--primary)]/20 px-5 py-4 flex items-center justify-between gap-4 animate-rise">
              <div>
                <p className="text-xs text-[var(--muted)] mb-0.5">Tu iPhone vale</p>
                <p className="text-2xl font-extrabold text-[var(--text)] tracking-[-0.03em]">
                  ${valor.toLocaleString("es-AR")}
                </p>
              </div>
              <button
                onClick={handleAplicar}
                className="shrink-0 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[#0a84ff33]"
              >
                Aplicar al carrito
              </button>
            </div>
          )}

          {allSelected && valor === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-2">
              Esta combinación no tiene cotización disponible.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TradeInWidget.tsx
git commit -m "feat: add TradeInWidget component"
```

---

## Task 4: Homepage integration

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Add import at top of file**

After the existing imports in `src/pages/HomePage.tsx`, add:

```tsx
import TradeInWidget from "../components/TradeInWidget";
```

- [ ] **Step 2: Add the section between categorias and banner usados**

Find the closing tag of the categorias section (the `)}` that ends `{categorias.length > 0 && (...)}`) and the opening of the `{/* Banner Usados */}` section. Insert between them:

```tsx
      {/* Trade-In Cotizador */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-3">
            Parte de pago
          </span>
          <h2 className="brand-heading text-3xl md:text-4xl font-bold text-[var(--text)]">
            ¿Tenés un iPhone para dar en parte de pago?
          </h2>
          <p className="text-[var(--muted)] max-w-xl mt-3">
            Seleccioná el modelo, almacenamiento y estado y te decimos cuánto vale.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <TradeInWidget />
        </div>
      </section>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: add TradeInWidget section to HomePage"
```

---

## Task 5: Detail page integration

**Files:**
- Modify: `src/pages/DetailPage.tsx`

- [ ] **Step 1: Add import**

After existing imports in `src/pages/DetailPage.tsx`, add:

```tsx
import TradeInWidget from "../components/TradeInWidget";
```

- [ ] **Step 2: Add widget below action buttons**

Find the closing `</div>` of the `pt-6 space-y-6` div that contains the action buttons grid (the last `</div>` before `</aside>`). Insert `<TradeInWidget />` right before `</aside>`:

```tsx
          <div className="pt-6">
            <TradeInWidget />
          </div>
        </aside>
```

Replace the existing:
```tsx
          </div>
        </aside>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/DetailPage.tsx
git commit -m "feat: add TradeInWidget to DetailPage below action buttons"
```

---

## Task 6: CartDrawer trade-in line

**Files:**
- Modify: `src/components/CartDrawer.tsx`

- [ ] **Step 1: Read tradeIn from store and update total**

In `CartDrawer.tsx`, after `const clearCart = useCatalogStore(...)` line (around line 39), add:

```tsx
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);
```

Change the `total` line from:
```tsx
  const total = items.reduce((sum, item) => sum + item.modelo.precio, 0);
```
to:
```tsx
  const subtotal = items.reduce((sum, item) => sum + item.modelo.precio, 0);
  const total = Math.max(0, subtotal - (tradeIn?.valor ?? 0));
```

- [ ] **Step 2: Add trade-in line in the summary footer**

Find the summary footer block in `CartDrawer.tsx` (the `border-t border-[var(--line)] px-6 py-5 bg-white/55` div). Replace the existing total line:

```tsx
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-[var(--muted)]">{items.length} productos</span>
                <span className="text-xl font-extrabold text-[var(--text)]">
                  ${total.toLocaleString("es-AR")}
                </span>
              </div>
```

with:

```tsx
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{items.length} productos</span>
                  <span className="font-semibold text-[var(--text)]">
                    ${subtotal.toLocaleString("es-AR")}
                  </span>
                </div>
                {tradeIn && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">
                        {tradeIn.modelo} {tradeIn.storage} · {tradeIn.condicion}
                      </span>
                      <button
                        onClick={clearTradeIn}
                        className="text-[#b42318] hover:text-[#912018] text-xs font-semibold transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                    <span className="font-semibold text-[#0a7a4a]">
                      −${tradeIn.valor.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <span className="text-sm font-bold text-[var(--text)]">Total a pagar</span>
                  <span className="text-xl font-extrabold text-[var(--text)]">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CartDrawer.tsx
git commit -m "feat: show trade-in deduction in CartDrawer"
```

---

## Task 7: CartPage trade-in line

**Files:**
- Modify: `src/pages/CartPage.tsx`

- [ ] **Step 1: Read tradeIn from store and update total**

In `CartPage.tsx`, after `const clearCart = useCatalogStore(...)` (around line 13), add:

```tsx
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);
```

Change:
```tsx
  const total = items.reduce((sum, item) => sum + item.modelo.precio, 0);
```
to:
```tsx
  const subtotal = items.reduce((sum, item) => sum + item.modelo.precio, 0);
  const total = Math.max(0, subtotal - (tradeIn?.valor ?? 0));
```

- [ ] **Step 2: Update the resumen aside to show trade-in deduction**

Find the `space-y-3` div with the summary rows in the `<aside>` (around line 146). Replace:

```tsx
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Productos</span>
              <span className="font-semibold text-[var(--text)]">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total estimado</span>
              <span className="font-semibold text-[var(--text)]">
                ${total.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
```

with:

```tsx
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Productos</span>
              <span className="font-semibold text-[var(--text)]">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[var(--text)]">
                ${subtotal.toLocaleString("es-AR")}
              </span>
            </div>
            {tradeIn && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span>
                    {tradeIn.modelo} {tradeIn.storage} · {tradeIn.condicion}
                  </span>
                  <button
                    onClick={clearTradeIn}
                    className="text-left text-[#b42318] hover:text-[#912018] text-xs font-semibold transition-colors"
                  >
                    Quitar
                  </button>
                </div>
                <span className="font-semibold text-[#0a7a4a]">
                  −${tradeIn.valor.toLocaleString("es-AR")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 font-bold text-[var(--text)]">
              <span>Total a pagar</span>
              <span>${total.toLocaleString("es-AR")}</span>
            </div>
          </div>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/maurolobo/SmartCloud/pixel && pnpm build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/CartPage.tsx
git commit -m "feat: show trade-in deduction in CartPage resumen"
```
