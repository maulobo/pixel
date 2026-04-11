import type { ModeloGroup, UnidadConModelo } from "../types";

function asPositiveNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getUnitPrice(unidad: UnidadConModelo) {
  return (
    asPositiveNumber(unidad.modelo.precio) ||
    asPositiveNumber(unidad.atributos.precio)
  );
}

export function getGroupMinPrice(group: ModeloGroup) {
  const prices = group.unidades
    .map(getUnitPrice)
    .filter((price) => price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}
