import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const CLIENT_ID = process.env.CLIENT_ID

const MODELOS_CSV_URL = process.env.MODELOS_CSV_URL
const UNIDADES_CSV_URL = process.env.UNIDADES_CSV_URL
const BANNERS_CSV_URL = process.env.BANNERS_CSV_URL

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CLIENT_ID) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, CLIENT_ID')
  process.exit(1)
}

if (!MODELOS_CSV_URL || !UNIDADES_CSV_URL || !BANNERS_CSV_URL) {
  console.error('Missing CSV env vars: MODELOS_CSV_URL, UNIDADES_CSV_URL, BANNERS_CSV_URL')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchCSV(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${url} (${res.status})`)
  const text = await res.text()
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  if (errors.length) console.warn('CSV parse warnings:', errors)
  return data
}

async function syncModelos() {
  console.log('Syncing modelos...')
  const rows = await fetchCSV(MODELOS_CSV_URL)
  const deduped = [...new Map(rows.map((r) => [r.modelo_id, r])).values()]
  if (deduped.length < rows.length)
    console.warn(`  Skipped ${rows.length - deduped.length} duplicate modelo_id rows`)
  const data = deduped.map((r) => ({ ...r, client_id: CLIENT_ID }))

  const { error } = await supabase
    .from('modelos')
    .upsert(data, { onConflict: 'modelo_id,client_id' })

  if (error) throw new Error(`modelos upsert failed: ${error.message}`)
  console.log(`  ${data.length} modelos synced`)
}

async function syncUnidades() {
  console.log('Syncing unidades...')
  const rows = await fetchCSV(UNIDADES_CSV_URL)
  // Deduplicate by unidad_id (last row wins)
  const deduped = [...new Map(rows.map((r) => [r.unidad_id, r])).values()]
  if (deduped.length < rows.length)
    console.warn(`  Skipped ${rows.length - deduped.length} duplicate unidad_id rows`)
  const data = deduped.map((r) => ({ ...r, client_id: CLIENT_ID }))

  const { error } = await supabase
    .from('unidades')
    .upsert(data, { onConflict: 'unidad_id,client_id' })

  if (error) throw new Error(`unidades upsert failed: ${error.message}`)
  console.log(`  ${data.length} unidades synced`)
}

async function syncBanners() {
  console.log('Syncing banners...')
  const rows = await fetchCSV(BANNERS_CSV_URL)

  // Banners: delete existing for this client and reinsert (orden puede cambiar)
  const { error: delError } = await supabase
    .from('banners')
    .delete()
    .eq('client_id', CLIENT_ID)

  if (delError) throw new Error(`banners delete failed: ${delError.message}`)

  const data = rows.map((r, i) => ({ ...r, client_id: CLIENT_ID, orden: i }))

  const { error } = await supabase.from('banners').insert(data)
  if (error) throw new Error(`banners insert failed: ${error.message}`)
  console.log(`  ${data.length} banners synced`)
}

async function main() {
  console.log(`Starting sync for client: ${CLIENT_ID}`)
  try {
    await syncModelos()
    await syncUnidades()
    await syncBanners()
    console.log('Sync complete.')
  } catch (err) {
    console.error('Sync failed:', err.message)
    process.exit(1)
  }
}

main()
