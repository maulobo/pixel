import { createClient } from '@supabase/supabase-js'
import type { Banner, Modelo, Unidad, UnidadConModelo } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !CLIENT_ID) {
  throw new Error('Missing Supabase env vars')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchCatalog(): Promise<UnidadConModelo[]> {
  const { data, error } = await supabase
    .from('unidades')
    .select('*, modelo:modelos(*)')
    .eq('client_id', CLIENT_ID)
    .eq('disponible', true)

  if (error) throw new Error(`fetchCatalog failed: ${error.message}`)

  return (data ?? []) as UnidadConModelo[]
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('client_id', CLIENT_ID)
    .order('orden')

  if (error) throw new Error(`fetchBanners failed: ${error.message}`)

  return (data ?? []) as Banner[]
}

export async function fetchUnidad(unidadId: string): Promise<UnidadConModelo | null> {
  const { data, error } = await supabase
    .from('unidades')
    .select('*, modelo:modelos(*)')
    .eq('client_id', CLIENT_ID)
    .eq('unidad_id', unidadId)
    .single()

  if (error) return null

  return data as UnidadConModelo
}
