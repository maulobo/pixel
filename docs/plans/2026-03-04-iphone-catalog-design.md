# Pixel — Apple Devices Catalog Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

Web catalog to showcase used/refurbished Apple devices (iPhones + Macs). No e-commerce — users are redirected to WhatsApp to inquire. Client manages all data in Google Sheets (Excel-compatible).

## Data Source

**Google Sheets — 2 tabs, published as CSV**

### Tab 1: `modelos`
| Field | Example |
|---|---|
| `modelo_id` | `iphone-13-pro` |
| `tipo` | `iPhone` / `Mac` |
| `nombre` | `iPhone 13 Pro` |
| `descripcion_general` | "Pantalla Super Retina XDR..." |
| `specs` | "Chip A15, 5G, Face ID..." |
| `imagen_principal` | URL |

### Tab 2: `unidades`
| Field | Example |
|---|---|
| `unidad_id` | `iph13p-001` |
| `modelo_id` | `iphone-13-pro` |
| `color` | `Azul Sierra` |
| `capacidad` | `256GB` |
| `bateria` | `87` |
| `condicion` | `Muy bueno` |
| `precio` | `850000` |
| `descripcion_particular` | "Rasguño leve en marco lateral" |
| `disponible` | `TRUE` |
| `imagen_url` | URL |

## Architecture

```
Google Sheets (2 CSV tabs)
        ↓ fetch on mount
   combine modelos + unidades in memory
        ↓
   Zustand global store
        ↓
   client-side filters (.filter())
        ↓
   render cards / detail page
```

## Pages & Routing

| Route | Description |
|---|---|
| `/` | Home — hero + iPhone/Mac categories |
| `/catalogo` | Grid + filters sidebar |
| `/catalogo/:unidad_id` | Unit detail page |

## Filters (client-side)
- Tipo (iPhone / Mac)
- Modelo
- Color
- Precio (range slider)
- Batería (%)
- Condición

## WhatsApp Integration
Pre-built message: `"Hola! Me interesa el {nombre} {capacidad} {color} (ref: {unidad_id})"`

## UI Design

- **Aesthetic:** Apple-style — white `#FFFFFF`, light gray `#F5F5F7`, black `#1D1D1F`, blue `#0071E3`
- **Font:** Inter
- **Layout:** Generous whitespace, rounded cards, subtle shadows

## Stack

| Package | Version |
|---|---|
| React | 19.2.4 |
| Vite | 7.3.1 |
| TypeScript | 5.x |
| TailwindCSS | 4.2.1 |
| React Router | 7.13.1 |
| Zustand | 5.0.11 |
| PapaParse | 5.5.3 |

**Deploy:** Vercel (free tier)
**Images:** URLs in Sheet (migrate to Supabase Storage later)
