import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

const SUPABASE_URL        = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// Debounce: ignorar requests que lleguen dentro de los 2 min del último sync
const lastSyncTime: Record<string, number> = {}
const DEBOUNCE_MS = 2 * 60 * 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchCSV(url: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CSV fetch failed: ${url} (${res.status})`)
  const text = await res.text()
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  return data
}

function dedupe<T extends Record<string, unknown>>(rows: T[], key: string): T[] {
  return [...new Map(rows.map((r) => [r[key], r])).values()]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientId } = req.body as { clientId?: string }
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' })

  // Debounce: si sincronizamos hace menos de 2 min, ignorar
  const last = lastSyncTime[clientId] ?? 0
  if (Date.now() - last < DEBOUNCE_MS) {
    return res.status(200).json({ status: 'debounced', message: 'Sync skipped — too soon' })
  }

  // Buscar el cliente en Supabase para obtener sus CSV URLs
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('modelos_csv_url, unidades_csv_url, banners_csv_url')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return res.status(404).json({ error: 'Client not found' })
  }

  try {
    // Sync modelos
    const modelos = dedupe(await fetchCSV(client.modelos_csv_url), 'modelo_id')
      .map((r) => ({ ...r, client_id: clientId }))
    await supabase.from('modelos').upsert(modelos, { onConflict: 'modelo_id,client_id' })

    // Sync unidades
    const unidades = dedupe(await fetchCSV(client.unidades_csv_url), 'unidad_id')
      .map((r) => ({ ...r, client_id: clientId }))
    await supabase.from('unidades').upsert(unidades, { onConflict: 'unidad_id,client_id' })

    // Sync banners
    await supabase.from('banners').delete().eq('client_id', clientId)
    const banners = (await fetchCSV(client.banners_csv_url))
      .map((r, i) => ({ ...r, client_id: clientId, orden: i }))
    if (banners.length > 0) await supabase.from('banners').insert(banners)

    lastSyncTime[clientId] = Date.now()
    return res.status(200).json({ status: 'ok', modelos: modelos.length, unidades: unidades.length, banners: banners.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
