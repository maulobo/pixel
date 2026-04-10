export type CommercialState = "nuevo" | "usado";

export function getCommercialState(
  condicion: string,
  bateria: string | number,
): CommercialState {
  const c = condicion.trim().toLowerCase();
  const bateriaNum = typeof bateria === "string" ? Number(bateria) : bateria;

  if (
    c.includes("nuevo") ||
    c.includes("sin uso") ||
    c.includes("sellado") ||
    c.includes("como nuevo")
  ) {
    return "nuevo";
  }

  if (c.includes("excelente") && bateriaNum >= 90) {
    return "nuevo";
  }

  return "usado";
}
