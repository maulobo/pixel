import Papa from 'papaparse'
import type { Banner, Modelo, Unidad, UnidadConModelo } from '../types'

const MODELOS_CSV_URL = import.meta.env.VITE_MODELOS_CSV_URL
const UNIDADES_CSV_URL = import.meta.env.VITE_UNIDADES_CSV_URL
const BANNERS_CSV_URL = import.meta.env.VITE_BANNERS_CSV_URL

async function fetchCSV<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err) => reject(err),
    })
  })
}

export async function fetchCatalog(): Promise<UnidadConModelo[]> {
  if (!MODELOS_CSV_URL || !UNIDADES_CSV_URL) {
    throw new Error('Missing env vars: VITE_MODELOS_CSV_URL and/or VITE_UNIDADES_CSV_URL')
  }

  const [modelos, unidades] = await Promise.all([
    fetchCSV<Modelo>(MODELOS_CSV_URL),
    fetchCSV<Unidad>(UNIDADES_CSV_URL),
  ])

  const modeloMap = new Map(modelos.map((m) => [m.modelo_id, m]))

  return unidades
    .filter((u) => u.disponible)
    .filter((u) => modeloMap.has(u.modelo_id))
    .map((u) => ({
      ...u,
      modelo: modeloMap.get(u.modelo_id) as Modelo,
    }))
}

export async function fetchBanners(): Promise<Banner[]> {
  if (!BANNERS_CSV_URL) {
    throw new Error('Missing env var: VITE_BANNERS_CSV_URL')
  }
  return fetchCSV<Banner>(BANNERS_CSV_URL)
}
