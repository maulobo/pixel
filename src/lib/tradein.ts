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
