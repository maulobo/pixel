export type CommercialState = "nuevo" | "usado";

export function getCommercialState(
  condicion: string,
  bateria: number,
): CommercialState {
  const c = condicion.trim().toLowerCase();

  if (
    c.includes("nuevo") ||
    c.includes("sin uso") ||
    c.includes("sellado") ||
    c.includes("como nuevo")
  ) {
    return "nuevo";
  }

  // Heuristic for second-hand catalogs: excellent condition + high battery behaves as "like new".
  if (c.includes("excelente") && bateria >= 90) {
    return "nuevo";
  }

  return "usado";
}
