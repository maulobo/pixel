# Trade-In Widget — Design Spec
**Date:** 2026-04-10

## Overview

A reusable `TradeInWidget` component that lets users cotizar su iPhone usado como parte de pago. Aparece en la homepage y en la página de detalle de producto. El valor cotizado se aplica como descuento en el carrito.

---

## Data

### Precio table (`src/lib/tradein.ts`)

Hardcoded map: `modelo × storage × condicion → precio (ARS)`.

- **Modelos:** iPhone X, XR, XS, XS Max, 11, 11 Pro, 11 Pro Max, 12, 12 Mini, 12 Pro, 12 Pro Max, 13, 13 Mini, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max
- **Storage:** 64GB, 128GB, 256GB, 512GB, 1TB
- **Condición:** Excelente / Bueno / Regular / Roto

Exports:
- `IPHONE_MODELOS: string[]`
- `STORAGE_OPTIONS: string[]`
- `CONDICION_OPTIONS: string[]`
- `cotizar(modelo, storage, condicion): number` — returns 0 if combo not found

---

## State (Zustand)

Add to `catalogStore`:

```ts
tradeIn: {
  modelo: string;
  storage: string;
  condicion: string;
  valor: number;
} | null;

setTradeIn: (t: { modelo: string; storage: string; condicion: string; valor: number }) => void;
clearTradeIn: () => void;
```

`tradeIn` is NOT persisted (resets on page reload).

---

## Components

### `TradeInWidget`

Location: `src/components/TradeInWidget.tsx`

A self-contained card with:
1. Three selects: Modelo iPhone / Almacenamiento / Estado
2. When all three are selected → shows result: `"Tu iPhone vale $X"`
3. Button "Aplicar al carrito" → calls `setTradeIn(...)`, shows confirmation

If a trade-in is already applied, shows `"Trade-in aplicado: $X"` with a "Cambiar" button to reset selects.

### Cart integration (`CartDrawer.tsx` + `CartPage.tsx`)

Both show an extra line item when `tradeIn !== null`:
```
iPhone 12 128GB · Bueno          −$350.000   [Quitar]
```
"Quitar" calls `clearTradeIn()`.

Total line shows: `Total a pagar: $X` (subtotal − tradeIn.valor).

---

## Placement

- **Homepage (`HomePage.tsx`):** New section between "Explora por categoria" and "Usados certificados" banner.
- **Detail page (`DetailPage.tsx`):** Below the action buttons (Agregar al carrito / WhatsApp).

Both use `<TradeInWidget />` with no props.

---

## Out of scope

- Admin UI to manage prices (hardcoded for now)
- WhatsApp message pre-filled with trade-in details
- Applying the trade-in discount to a specific product (cart handles it globally)
