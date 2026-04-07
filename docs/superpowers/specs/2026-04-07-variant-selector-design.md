# Diseño: Agrupación de variantes por modelo

**Fecha:** 2026-04-07  
**Estado:** Aprobado

---

## Problema

Actualmente cada `Unidad` es una card separada en el catálogo y tiene su propia página de detalle. Cuando un mismo modelo tiene múltiples unidades (ej: iPhone 12 azul 128GB, iPhone 12 rojo 256GB), aparecen como productos independientes, lo que genera ruido visual y dificulta la comparación.

---

## Objetivo

- En el catálogo: una sola card por modelo, con pills que muestran las variantes disponibles (colores, capacidades).
- En el detalle: selector de variantes interactivo. El precio, batería, condición e imagen reaccionan a la variante elegida.
- En el carrito: se guarda la `unidad_id` concreta de la variante seleccionada.

---

## Arquitectura

### Tipo nuevo: `ModeloGroup`

```ts
interface ModeloGroup {
  modelo: Modelo;
  unidades: UnidadConModelo[];
}
```

Generado en `CatalogPage` mediante `useMemo` agrupando `catalog` por `modelo_id`. No requiere cambios en Supabase ni en el store.

---

## Cambios por archivo

### `src/pages/CatalogPage.tsx`

- Agrega un `useMemo` que aplica los filtros actuales sobre `catalog` y luego agrupa por `modelo_id` en `ModeloGroup[]`.
- Los filtros (categoria, condicion, precio, batería) se aplican a nivel de unidad; si ninguna unidad del grupo pasa, el grupo no aparece.
- La paginación opera sobre el array de grupos.
- Pasa `ModeloGroup` a `DeviceCard`.

### `src/components/DeviceCard.tsx`

- Recibe `ModeloGroup` en lugar de `UnidadConModelo`.
- Muestra imagen y nombre del modelo.
- Pills de **colores únicos** disponibles entre las unidades del grupo.
- Pills de **capacidades únicas** disponibles.
- Precio: "desde $X" (mínimo del grupo).
- Badge: "N disponibles" (count de unidades).
- Link a `/catalogo/:modeloId`.
- **Se elimina el botón "Agregar al carrito"** — la selección de variante concreta solo ocurre en el detalle.

### `src/pages/DetailPage.tsx`

- Ruta: `/catalogo/:modeloId` (cambia de `:unidadId`).
- Al montar, busca todas las unidades del modelo en `catalog` filtrando por `modeloId`.
- Estado local: `selectedUnidad` — arranca en la unidad de menor precio.
- **Selector de variantes** (nuevo bloque en el aside, encima del precio):
  - Pills de color: al elegir un color, actualiza `selectedUnidad` a la unidad de ese color más barata.
  - Pills de capacidad: al elegir capacidad, actualiza `selectedUnidad` a la combinación color+capacidad si existe.
  - Pills no disponibles para la combinación actual se muestran deshabilitadas (opacas, no clickeables).
- Precio, batería, condición, imagen, link de WhatsApp y botón de carrito reaccionan a `selectedUnidad`.
- El botón "Agregar al carrito" agrega la `unidad_id` de `selectedUnidad`.

### `src/App.tsx`

- Ruta cambia de `/catalogo/:unidadId` a `/catalogo/:modeloId`.

---

## Comportamiento del carrito

- El carrito sigue almacenando `unidad_id[]` — sin cambios en el store.
- Solo se puede agregar al carrito desde el detalle, donde la variante está explícitamente elegida.
- Si el usuario entra al carrito con una unidad de un modelo que tiene variantes, se muestra la info de esa unidad específica (igual que hoy).

---

## Filtros del catálogo

Los filtros existentes (categoria, condicion, precio, bateriaMin, color, modelo) siguen funcionando:
- Se aplican a nivel de `UnidadConModelo` antes de agrupar.
- Si el filtro de `modelo` está activo, solo aparece ese grupo.
- Si el filtro de `color` está activo, solo aparecen grupos que tengan al menos una unidad de ese color; las pills del grupo mostrarán solo ese color.

---

## Lo que NO cambia

- Store (`catalogStore.ts`) — sin cambios.
- Tipos base (`Unidad`, `Modelo`, `UnidadConModelo`) — sin cambios.
- Lógica de Supabase — sin cambios.
- CartDrawer, CartPage — sin cambios.
- Filtros sidebar (`Filters.tsx`) — sin cambios.
