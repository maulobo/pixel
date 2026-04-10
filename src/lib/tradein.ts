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
