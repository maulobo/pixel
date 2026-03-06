# Pixel — Apple Catalog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready Apple device catalog (iPhones + Macs) that fetches data from Google Sheets, filters client-side, and redirects to WhatsApp on inquiry.

**Architecture:** React SPA scaffolded with Vite. Data is fetched from two Google Sheets tabs (modelos + unidades) published as CSV, parsed with PapaParse, combined in memory, and stored in Zustand. All filtering happens client-side. Three pages: Home, Catalog, Detail.

**Tech Stack:** React 19, Vite 7, TypeScript 5, TailwindCSS 4, React Router 7, Zustand 5, PapaParse 5.

---

### Task 1: Scaffold project

**Files:**
- Create: `/Users/maurolobo/SmartCloud/pixel/` (project root)

**Step 1: Scaffold Vite + React + TypeScript**

```bash
cd /Users/maurolobo/SmartCloud/pixel
pnpm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty", choose **Remove existing files and continue**.

**Step 2: Install base dependencies**

```bash
pnpm install
pnpm add react-router zustand papaparse
pnpm add -D @types/papaparse
```

**Step 3: Install TailwindCSS v4**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

**Step 4: Configure Vite to use Tailwind**

Replace contents of `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Step 5: Configure Tailwind in CSS**

Replace contents of `src/index.css`:

```css
@import "tailwindcss";
```

**Step 6: Clean up boilerplate**

Delete `src/App.css`.
Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <div>Pixel</div>
}
```

**Step 7: Verify it runs**

```bash
pnpm dev
```

Expected: browser shows "Pixel" on white background, no errors in console.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react ts project with tailwind v4"
```

---

### Task 2: Setup types and data layer

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/sheets.ts`

**Step 1: Define TypeScript types**

Create `src/types/index.ts`:

```ts
export interface Modelo {
  modelo_id: string
  tipo: 'iPhone' | 'Mac'
  nombre: string
  descripcion_general: string
  specs: string
  imagen_principal: string
}

export interface Unidad {
  unidad_id: string
  modelo_id: string
  color: string
  capacidad: string
  bateria: number
  condicion: string
  precio: number
  descripcion_particular: string
  disponible: boolean
  imagen_url: string
}

export interface UnidadConModelo extends Unidad {
  modelo: Modelo
}
```

**Step 2: Create Google Sheets fetcher**

Create `src/lib/sheets.ts`:

```ts
import Papa from 'papaparse'
import type { Modelo, Unidad, UnidadConModelo } from '../types'

// These URLs come from Google Sheets: File → Share → Publish to web → CSV
// Replace with real URLs when client provides the sheet
const MODELOS_CSV_URL = import.meta.env.VITE_MODELOS_CSV_URL
const UNIDADES_CSV_URL = import.meta.env.VITE_UNIDADES_CSV_URL

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
  const [modelos, unidades] = await Promise.all([
    fetchCSV<Modelo>(MODELOS_CSV_URL),
    fetchCSV<Unidad>(UNIDADES_CSV_URL),
  ])

  const modeloMap = new Map(modelos.map((m) => [m.modelo_id, m]))

  return unidades
    .filter((u) => u.disponible)
    .map((u) => ({
      ...u,
      modelo: modeloMap.get(u.modelo_id)!,
    }))
    .filter((u) => u.modelo != null)
}
```

**Step 3: Create .env with placeholder URLs**

Create `.env`:

```
VITE_MODELOS_CSV_URL=https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=modelos
VITE_UNIDADES_CSV_URL=https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=unidades
```

Add `.env` to `.gitignore`. Create `.env.example` with the same content.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add types and google sheets data fetcher"
```

---

### Task 3: Mock data for development

**Files:**
- Create: `src/lib/mockData.ts`

Since the real Google Sheet URL isn't set up yet, we need mock data to build the UI against.

**Step 1: Create mock data**

Create `src/lib/mockData.ts`:

```ts
import type { UnidadConModelo } from '../types'

export const mockCatalog: UnidadConModelo[] = [
  {
    unidad_id: 'iph13p-001',
    modelo_id: 'iphone-13-pro',
    color: 'Azul Sierra',
    capacidad: '256GB',
    bateria: 87,
    condicion: 'Muy bueno',
    precio: 850000,
    descripcion_particular: 'Rasguño leve en el marco lateral izquierdo, pantalla perfecta.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-blue-select?wid=940&hei=1112&fmt=png-alpha',
    modelo: {
      modelo_id: 'iphone-13-pro',
      tipo: 'iPhone',
      nombre: 'iPhone 13 Pro',
      descripcion_general: 'El iPhone 13 Pro lleva la experiencia Pro a un nuevo nivel con un sistema de cámara Pro de triple lente, chip A15 Bionic y pantalla Super Retina XDR con ProMotion.',
      specs: 'Chip A15 Bionic · Pantalla 6.1" Super Retina XDR ProMotion · Triple cámara 12MP · 5G · Face ID · iOS 17',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-blue-select?wid=940&hei=1112&fmt=png-alpha',
    },
  },
  {
    unidad_id: 'iph14-001',
    modelo_id: 'iphone-14',
    color: 'Medianoche',
    capacidad: '128GB',
    bateria: 91,
    condicion: 'Excelente',
    precio: 720000,
    descripcion_particular: 'Sin marcas, como nuevo. Cargador incluido.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-midnight-select?wid=940&hei=1112&fmt=png-alpha',
    modelo: {
      modelo_id: 'iphone-14',
      tipo: 'iPhone',
      nombre: 'iPhone 14',
      descripcion_general: 'El iPhone 14 ofrece el chip A15 Bionic, modo de acción y modo cinematográfico para videos de nivel profesional.',
      specs: 'Chip A15 Bionic · Pantalla 6.1" Super Retina XDR · Cámara 12MP · 5G · Face ID · iOS 17',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-midnight-select?wid=940&hei=1112&fmt=png-alpha',
    },
  },
  {
    unidad_id: 'iph15pm-001',
    modelo_id: 'iphone-15-pro-max',
    color: 'Titanio Natural',
    capacidad: '512GB',
    bateria: 95,
    condicion: 'Excelente',
    precio: 1450000,
    descripcion_particular: 'Impecable. Comprado hace 4 meses. Con funda y vidrio templado.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=940&hei=1112&fmt=png-alpha',
    modelo: {
      modelo_id: 'iphone-15-pro-max',
      tipo: 'iPhone',
      nombre: 'iPhone 15 Pro Max',
      descripcion_general: 'El iPhone 15 Pro Max presenta titanio de grado aeroespacial, chip A17 Pro y el botón de acción personalizable.',
      specs: 'Chip A17 Pro · Pantalla 6.7" Super Retina XDR ProMotion · Cámara 48MP · 5G · Face ID · USB-C',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=940&hei=1112&fmt=png-alpha',
    },
  },
  {
    unidad_id: 'mbam2-001',
    modelo_id: 'macbook-air-m2',
    color: 'Plata',
    capacidad: '256GB SSD · 8GB RAM',
    bateria: 0,
    condicion: 'Muy bueno',
    precio: 1200000,
    descripcion_particular: 'Pequeña marca en la tapa exterior, no afecta el uso. Batería en perfecto estado.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg',
    modelo: {
      modelo_id: 'macbook-air-m2',
      tipo: 'Mac',
      nombre: 'MacBook Air M2',
      descripcion_general: 'El MacBook Air con chip M2 es increíblemente fino y potente, con hasta 18 horas de batería y pantalla Liquid Retina de 13.6".',
      specs: 'Chip M2 · Pantalla 13.6" Liquid Retina · GPU 8 núcleos · Wi-Fi 6 · MagSafe · macOS',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg',
    },
  },
  {
    unidad_id: 'mbpm3-001',
    modelo_id: 'macbook-pro-m3',
    color: 'Gris Espacial',
    capacidad: '512GB SSD · 16GB RAM',
    bateria: 0,
    condicion: 'Excelente',
    precio: 2100000,
    descripcion_particular: 'Sin marcas. Año 2024. Incluye cargador 96W.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg',
    modelo: {
      modelo_id: 'macbook-pro-m3',
      tipo: 'Mac',
      nombre: 'MacBook Pro M3',
      descripcion_general: 'El MacBook Pro con chip M3 ofrece rendimiento profesional con pantalla Liquid Retina XDR y hasta 22 horas de batería.',
      specs: 'Chip M3 · Pantalla 14.2" Liquid Retina XDR · GPU 10 núcleos · Wi-Fi 6E · HDMI · SD Card',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg',
    },
  },
  {
    unidad_id: 'iph12-001',
    modelo_id: 'iphone-12',
    color: 'Rojo',
    capacidad: '64GB',
    bateria: 78,
    condicion: 'Bueno',
    precio: 480000,
    descripcion_particular: 'Rayones menores en la pantalla visibles con luz directa. Funciona perfecto.',
    disponible: true,
    imagen_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-red-select?wid=940&hei=1112&fmt=png-alpha',
    modelo: {
      modelo_id: 'iphone-12',
      tipo: 'iPhone',
      nombre: 'iPhone 12',
      descripcion_general: 'El iPhone 12 presenta diseño plano con Ceramic Shield, chip A14 Bionic y compatibilidad con 5G.',
      specs: 'Chip A14 Bionic · Pantalla 6.1" Super Retina XDR · Cámara 12MP · 5G · Face ID · MagSafe',
      imagen_principal: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-red-select?wid=940&hei=1112&fmt=png-alpha',
    },
  },
]
```

**Step 2: Commit**

```bash
git add src/lib/mockData.ts
git commit -m "feat: add mock catalog data for development"
```

---

### Task 4: Zustand store

**Files:**
- Create: `src/store/catalogStore.ts`

**Step 1: Create the store**

Create `src/store/catalogStore.ts`:

```ts
import { create } from 'zustand'
import type { UnidadConModelo } from '../types'

interface Filters {
  tipo: string        // '' | 'iPhone' | 'Mac'
  modelo: string      // '' | modelo_id
  color: string       // '' | color name
  precioMin: number
  precioMax: number
  bateriaMin: number  // 0 = all
  condicion: string   // '' | condicion name
}

interface CatalogStore {
  catalog: UnidadConModelo[]
  loading: boolean
  error: string | null
  filters: Filters
  setCatalog: (catalog: UnidadConModelo[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  resetFilters: () => void
  filteredCatalog: () => UnidadConModelo[]
}

const DEFAULT_FILTERS: Filters = {
  tipo: '',
  modelo: '',
  color: '',
  precioMin: 0,
  precioMax: 99999999,
  bateriaMin: 0,
  condicion: '',
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  catalog: [],
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  setCatalog: (catalog) => set({ catalog }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  filteredCatalog: () => {
    const { catalog, filters } = get()
    return catalog.filter((u) => {
      if (filters.tipo && u.modelo.tipo !== filters.tipo) return false
      if (filters.modelo && u.modelo_id !== filters.modelo) return false
      if (filters.color && u.color !== filters.color) return false
      if (u.precio < filters.precioMin || u.precio > filters.precioMax) return false
      if (filters.bateriaMin > 0 && u.bateria < filters.bateriaMin) return false
      if (filters.condicion && u.condicion !== filters.condicion) return false
      return true
    })
  },
}))
```

**Step 2: Commit**

```bash
git add src/store/catalogStore.ts
git commit -m "feat: add zustand catalog store with filters"
```

---

### Task 5: Router setup + Layout

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/Navbar.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/CatalogPage.tsx`
- Create: `src/pages/DetailPage.tsx`

**Step 1: Setup router in main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 2: Setup routes in App.tsx**

Replace `src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router'
import { useEffect } from 'react'
import { useCatalogStore } from './store/catalogStore'
import { mockCatalog } from './lib/mockData'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import DetailPage from './pages/DetailPage'

export default function App() {
  const setCatalog = useCatalogStore((s) => s.setCatalog)

  // Load mock data on startup (swap for fetchCatalog() when Sheets URL is ready)
  useEffect(() => {
    setCatalog(mockCatalog)
  }, [setCatalog])

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] font-sans">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/catalogo/:unidadId" element={<DetailPage />} />
      </Routes>
    </div>
  )
}
```

**Step 3: Create placeholder pages**

Create `src/pages/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <div className="p-8">Home</div>
}
```

Create `src/pages/CatalogPage.tsx`:
```tsx
export default function CatalogPage() {
  return <div className="p-8">Catalog</div>
}
```

Create `src/pages/DetailPage.tsx`:
```tsx
export default function DetailPage() {
  return <div className="p-8">Detail</div>
}
```

**Step 4: Create Navbar**

Create `src/components/Navbar.tsx`:

```tsx
import { Link } from 'react-router'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
          Pixel
        </Link>
        <Link
          to="/catalogo"
          className="text-sm text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    </nav>
  )
}
```

**Step 5: Verify routing works**

```bash
pnpm dev
```

Navigate to `/`, `/catalogo`, `/catalogo/test` — each should render their placeholder text.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: setup router, layout and navbar"
```

---

### Task 6: Home page

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Build the home page**

Replace `src/pages/HomePage.tsx`:

```tsx
import { Link } from 'react-router'

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F5F5F7] py-24 px-6 text-center">
        <p className="text-sm font-semibold text-[#0071E3] uppercase tracking-widest mb-4">
          Dispositivos Apple
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1D1D1F] mb-6 leading-tight">
          Usados y reacondicionados.<br />
          <span className="text-[#6E6E73]">Con garantía de calidad.</span>
        </h1>
        <p className="text-xl text-[#6E6E73] mb-10 max-w-xl mx-auto">
          Encontrá el iPhone o Mac perfecto para vos. Revisados, probados y listos para usar.
        </p>
        <Link
          to="/catalogo"
          className="inline-block bg-[#0071E3] text-white text-base font-medium px-8 py-3 rounded-full hover:bg-[#0077ED] transition-colors"
        >
          Ver catálogo
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/catalogo?tipo=iPhone"
          className="group bg-[#F5F5F7] rounded-3xl p-10 flex flex-col gap-4 hover:bg-[#E8E8ED] transition-colors"
        >
          <span className="text-4xl">📱</span>
          <div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F]">iPhones</h2>
            <p className="text-[#6E6E73] mt-1">iPhone 12, 13, 14, 15 y más</p>
          </div>
          <span className="text-[#0071E3] text-sm font-medium group-hover:underline">
            Ver iPhones →
          </span>
        </Link>

        <Link
          to="/catalogo?tipo=Mac"
          className="group bg-[#F5F5F7] rounded-3xl p-10 flex flex-col gap-4 hover:bg-[#E8E8ED] transition-colors"
        >
          <span className="text-4xl">💻</span>
          <div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F]">Macs</h2>
            <p className="text-[#6E6E73] mt-1">MacBook Air, MacBook Pro M1, M2, M3</p>
          </div>
          <span className="text-[#0071E3] text-sm font-medium group-hover:underline">
            Ver Macs →
          </span>
        </Link>
      </section>
    </main>
  )
}
```

**Step 2: Verify visually**

```bash
pnpm dev
```

Home should show hero + two category cards.

**Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: build home page with hero and categories"
```

---

### Task 7: Device card component

**Files:**
- Create: `src/components/DeviceCard.tsx`

**Step 1: Create the card**

Create `src/components/DeviceCard.tsx`:

```tsx
import { Link } from 'react-router'
import type { UnidadConModelo } from '../types'

interface Props {
  unidad: UnidadConModelo
}

function BatteryBadge({ value }: { value: number }) {
  if (value === 0) return null
  const color = value >= 85 ? 'text-green-600 bg-green-50' : value >= 70 ? 'text-yellow-600 bg-yellow-50' : 'text-red-500 bg-red-50'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      🔋 {value}%
    </span>
  )
}

export default function DeviceCard({ unidad }: Props) {
  return (
    <Link
      to={`/catalogo/${unidad.unidad_id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="bg-[#F5F5F7] aspect-square flex items-center justify-center p-8">
        <img
          src={unidad.imagen_url || unidad.modelo.imagen_principal}
          alt={`${unidad.modelo.nombre} ${unidad.color}`}
          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/F5F5F7/6E6E73?text=Sin+imagen'
          }}
        />
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#6E6E73] font-medium uppercase tracking-wide">
              {unidad.modelo.tipo}
            </p>
            <h3 className="text-base font-semibold text-[#1D1D1F] leading-tight">
              {unidad.modelo.nombre}
            </h3>
          </div>
          <BatteryBadge value={unidad.bateria} />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-[#6E6E73]">
          <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-full">{unidad.color}</span>
          {unidad.capacidad && (
            <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-full">{unidad.capacidad}</span>
          )}
          <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-full">{unidad.condicion}</span>
        </div>

        <p className="mt-auto pt-3 text-xl font-semibold text-[#1D1D1F]">
          ${unidad.precio.toLocaleString('es-AR')}
        </p>
      </div>
    </Link>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/DeviceCard.tsx
git commit -m "feat: add device card component"
```

---

### Task 8: Catalog page with filters

**Files:**
- Create: `src/components/Filters.tsx`
- Modify: `src/pages/CatalogPage.tsx`

**Step 1: Create Filters component**

Create `src/components/Filters.tsx`:

```tsx
import { useCatalogStore } from '../store/catalogStore'

export default function Filters() {
  const { catalog, filters, setFilter, resetFilters } = useCatalogStore()

  const tipos = ['iPhone', 'Mac']
  const modelos = [...new Set(catalog.map((u) => u.modelo.nombre))].sort()
  const colores = [...new Set(catalog.map((u) => u.color))].sort()
  const condiciones = [...new Set(catalog.map((u) => u.condicion))].sort()
  const precios = catalog.map((u) => u.precio)
  const maxPrecio = precios.length ? Math.max(...precios) : 9999999

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-[#F5F5F7] rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1D1D1F]">Filtros</h2>
          <button
            onClick={resetFilters}
            className="text-xs text-[#0071E3] hover:underline"
          >
            Limpiar
          </button>
        </div>

        {/* Tipo */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">Tipo</p>
          <div className="flex gap-2 flex-wrap">
            {['', ...tipos].map((t) => (
              <button
                key={t}
                onClick={() => setFilter('tipo', t)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  filters.tipo === t
                    ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                    : 'bg-white text-[#1D1D1F] border-gray-200 hover:border-gray-400'
                }`}
              >
                {t || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Modelo */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">Modelo</p>
          <select
            value={filters.modelo}
            onChange={(e) => setFilter('modelo', e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          >
            <option value="">Todos</option>
            {modelos.map((m) => (
              <option key={m} value={catalog.find((u) => u.modelo.nombre === m)?.modelo_id}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">Color</p>
          <select
            value={filters.color}
            onChange={(e) => setFilter('color', e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          >
            <option value="">Todos</option>
            {colores.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Condición */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">Condición</p>
          <select
            value={filters.condicion}
            onChange={(e) => setFilter('condicion', e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          >
            <option value="">Todas</option>
            {condiciones.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Batería */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">
            Batería mínima: {filters.bateriaMin > 0 ? `${filters.bateriaMin}%` : 'Todas'}
          </p>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.bateriaMin}
            onChange={(e) => setFilter('bateriaMin', Number(e.target.value))}
            className="w-full accent-[#0071E3]"
          />
        </div>

        {/* Precio */}
        <div>
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">
            Precio máx: ${filters.precioMax === 99999999 ? 'Sin límite' : filters.precioMax.toLocaleString('es-AR')}
          </p>
          <input
            type="range"
            min={0}
            max={maxPrecio}
            step={50000}
            value={filters.precioMax === 99999999 ? maxPrecio : filters.precioMax}
            onChange={(e) => setFilter('precioMax', Number(e.target.value) === maxPrecio ? 99999999 : Number(e.target.value))}
            className="w-full accent-[#0071E3]"
          />
        </div>
      </div>
    </aside>
  )
}
```

**Step 2: Build catalog page**

Replace `src/pages/CatalogPage.tsx`:

```tsx
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useCatalogStore } from '../store/catalogStore'
import Filters from '../components/Filters'
import DeviceCard from '../components/DeviceCard'

export default function CatalogPage() {
  const [searchParams] = useSearchParams()
  const { filteredCatalog, setFilter, loading } = useCatalogStore()

  // Apply ?tipo= from URL (from home category links)
  useEffect(() => {
    const tipo = searchParams.get('tipo') ?? ''
    setFilter('tipo', tipo)
  }, [searchParams, setFilter])

  const results = filteredCatalog()

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-8">Catálogo</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <Filters />

        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-[#6E6E73]">Cargando...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-[#6E6E73]">
              No hay dispositivos con esos filtros.
            </div>
          ) : (
            <>
              <p className="text-sm text-[#6E6E73] mb-5">{results.length} dispositivos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map((u) => (
                  <DeviceCard key={u.unidad_id} unidad={u} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
```

**Step 3: Verify catalog with filters**

```bash
pnpm dev
```

Go to `/catalogo` — should show 6 mock devices in a grid. Test filters: clicking "iPhone" should show 4 devices, "Mac" shows 2.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: build catalog page with filters and device grid"
```

---

### Task 9: Detail page + WhatsApp button

**Files:**
- Modify: `src/pages/DetailPage.tsx`

**Step 1: Build detail page**

Replace `src/pages/DetailPage.tsx`:

```tsx
import { useParams, Link } from 'react-router'
import { useCatalogStore } from '../store/catalogStore'

const WHATSAPP_NUMBER = '5492996XXXXXXX' // Replace with client's number

function buildWhatsAppUrl(unidad: { modelo: { nombre: string }; capacidad: string; color: string; unidad_id: string }) {
  const msg = encodeURIComponent(
    `Hola! Me interesa el ${unidad.modelo.nombre} ${unidad.capacidad} ${unidad.color} (ref: ${unidad.unidad_id}). ¿Está disponible?`
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
}

function BatteryBar({ value }: { value: number }) {
  if (value === 0) return null
  const color = value >= 85 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[#6E6E73]">Estado de batería</span>
        <span className="font-semibold text-[#1D1D1F]">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function DetailPage() {
  const { unidadId } = useParams()
  const catalog = useCatalogStore((s) => s.catalog)
  const unidad = catalog.find((u) => u.unidad_id === unidadId)

  if (!unidad) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[#6E6E73]">Dispositivo no encontrado.</p>
        <Link to="/catalogo" className="text-[#0071E3] mt-4 inline-block hover:underline">
          ← Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <Link to="/catalogo" className="text-sm text-[#0071E3] hover:underline mb-8 inline-block">
        ← Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-[#F5F5F7] rounded-3xl aspect-square flex items-center justify-center p-10">
          <img
            src={unidad.imagen_url || unidad.modelo.imagen_principal}
            alt={`${unidad.modelo.nombre} ${unidad.color}`}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/F5F5F7/6E6E73?text=Sin+imagen'
            }}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-[#0071E3] uppercase tracking-widest mb-1">
              {unidad.modelo.tipo}
            </p>
            <h1 className="text-4xl font-semibold text-[#1D1D1F] leading-tight">
              {unidad.modelo.nombre}
            </h1>
            <p className="text-xl text-[#6E6E73] mt-1">
              {unidad.capacidad} · {unidad.color}
            </p>
          </div>

          <p className="text-3xl font-semibold text-[#1D1D1F]">
            ${unidad.precio.toLocaleString('es-AR')}
          </p>

          {/* Unit specific */}
          <div className="bg-[#F5F5F7] rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[#6E6E73] uppercase tracking-wide">
              Estado de esta unidad
            </h2>
            <BatteryBar value={unidad.bateria} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6E6E73]">Condición</span>
              <span className="font-semibold text-[#1D1D1F]">{unidad.condicion}</span>
            </div>
            {unidad.descripcion_particular && (
              <div>
                <p className="text-xs text-[#6E6E73] mb-1">Notas</p>
                <p className="text-sm text-[#1D1D1F]">{unidad.descripcion_particular}</p>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={buildWhatsAppUrl(unidad)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white text-center font-semibold py-4 rounded-2xl hover:bg-[#20BF5B] transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>

          {/* Model general info */}
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2">Sobre el {unidad.modelo.nombre}</h2>
            <p className="text-sm text-[#6E6E73] leading-relaxed mb-4">{unidad.modelo.descripcion_general}</p>
            <p className="text-xs text-[#6E6E73] leading-relaxed">{unidad.modelo.specs}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
```

**Step 2: Verify detail page**

```bash
pnpm dev
```

Click any card from catalog — should land on detail page with image, battery bar, condition, WhatsApp button, and model description.

**Step 3: Commit**

```bash
git add src/pages/DetailPage.tsx
git commit -m "feat: build detail page with whatsapp cta and unit info"
```

---

### Task 10: Connect real Google Sheets

**Files:**
- Modify: `src/App.tsx`
- Modify: `.env`

This task is done when the client shares their Google Sheet.

**Step 1: Publish Google Sheet as CSV**

In Google Sheets: `Archivo → Compartir → Publicar en la web`
- Publish tab `modelos` as CSV → copy URL
- Publish tab `unidades` as CSV → copy URL

**Step 2: Update .env**

```
VITE_MODELOS_CSV_URL=<url from step 1>
VITE_UNIDADES_CSV_URL=<url from step 1>
```

**Step 3: Swap mock data for real fetch in App.tsx**

In `src/App.tsx`, replace the useEffect:

```tsx
import { fetchCatalog } from './lib/sheets'

useEffect(() => {
  setLoading(true)
  fetchCatalog()
    .then(setCatalog)
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false))
}, [setCatalog, setLoading, setError])
```

Also add `setLoading` and `setError` to the store destructure.

**Step 4: Test with real data, then commit**

```bash
git add .env.example src/App.tsx
git commit -m "feat: connect real google sheets data source"
```

---

### Task 11: Deploy to Vercel

**Step 1: Push to GitHub**

```bash
git remote add origin <github-repo-url>
git push -u origin main
```

**Step 2: Deploy on Vercel**

1. Go to vercel.com → New Project → Import GitHub repo
2. Framework: Vite (auto-detected)
3. Add environment variables: `VITE_MODELOS_CSV_URL` and `VITE_UNIDADES_CSV_URL`
4. Deploy

**Step 3: Verify production build locally first**

```bash
pnpm build && pnpm preview
```

Expected: no build errors, all pages work.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: production build verified"
```
