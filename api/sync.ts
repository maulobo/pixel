import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

const DEBOUNCE_MS = 2 * 60 * 1000

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
  // Health check
  if (req.method === 'GET') return res.status(200).json({ status: 'ok' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Missing server env vars: SUPABASE_URL or SUPABASE_SERVICE_KEY' })
  }

  const { clientId } = (req.body ?? {}) as { clientId?: string }
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' })

  // Debounce
  const last = lastSyncTime[clientId] ?? 0
  if (Date.now() - last < DEBOUNCE_MS) {
    return res.status(200).json({ status: 'debounced' })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('modelos_csv_url, unidades_csv_url, banners_csv_url, last_synced_at')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return res.status(404).json({ error: 'Client not found', detail: clientError?.message })
  }

  // Debounce via DB — más confiable que in-memory en serverless
  if (client.last_synced_at) {
    const elapsed = Date.now() - new Date(client.last_synced_at).getTime()
    if (elapsed < DEBOUNCE_MS) {
      return res.status(200).json({ status: 'debounced', next_sync_in_seconds: Math.ceil((DEBOUNCE_MS - elapsed) / 1000) })
    }
  }

  try {
    const modelos = dedupe(await fetchCSV(client.modelos_csv_url), 'modelo_id')
      .map((r) => ({ ...r, client_id: clientId }))
    await supabase.from('modelos').upsert(modelos, { onConflict: 'modelo_id,client_id' })

    const unidades = dedupe(await fetchCSV(client.unidades_csv_url), 'unidad_id')
      .map((r) => ({ ...r, client_id: clientId }))
    await supabase.from('unidades').upsert(unidades, { onConflict: 'unidad_id,client_id' })

    await supabase.from('banners').delete().eq('client_id', clientId)
    const banners = (await fetchCSV(client.banners_csv_url))
      .map((r, i) => ({ ...r, client_id: clientId, orden: i }))
    if (banners.length > 0) await supabase.from('banners').insert(banners)

    await supabase.from('clients').update({ last_synced_at: new Date().toISOString() }).eq('id', clientId)
    return res.status(200).json({ status: 'ok', modelos: modelos.length, unidades: unidades.length, banners: banners.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
