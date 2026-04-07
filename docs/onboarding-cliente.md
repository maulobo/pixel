# Onboarding cliente nuevo — Pixel

Tiempo estimado: 30 minutos.

---

## Paso 1 — Supabase: crear proyecto

1. Ir a https://supabase.com → New project
2. Nombre: `pixel-[nombre-cliente]`
3. Generar una contraseña fuerte (guardarla)
4. Region: la más cercana al cliente
5. Esperar que termine de provisionar (~2 min)

**Guardar estos datos:**
- `SUPABASE_URL` → Settings → API → Project URL
- `SUPABASE_ANON_KEY` → Settings → API → anon / public
- `SUPABASE_SERVICE_KEY` → Settings → API → service_role (secret)

---

## Paso 2 — Supabase: crear tablas y RLS

1. Ir a SQL Editor
2. Pegar y ejecutar el contenido de `supabase/schema.sql`
3. Verificar que devuelve `true` para las 3 tablas:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('modelos', 'unidades', 'banners');
```

---

## Paso 3 — Generar CLIENT_ID

Generar un UUID único para el cliente. Opciones:
- Online: https://www.uuidgenerator.net
- Terminal: `uuidgen`

Guardar el UUID — se usa en Sheets y en Vercel.

---

## Paso 4 — Google Sheets: crear el Sheet

**Opción A — Si ya tenés un Sheet template guardado (recomendado):**
1. Abrir el Sheet template → Archivo → Hacer una copia
2. Renombrar: `Pixel — [Nombre Cliente]`
3. Mover a una carpeta del cliente si querés organizarlo

**Opción B — Crear desde cero (primera vez):**
1. Crear un Google Sheet nuevo
2. Renombrar: `Pixel — [Nombre Cliente]`
3. Crear 3 hojas (tabs) con estos nombres exactos: `modelos`, `unidades`, `banners`
4. En cada hoja, importar el CSV correspondiente de `sheets-template/`:
   - Archivo → Importar → Subir → seleccionar el CSV → "Insertar en la hoja actual"
   - Repetir para las 3 hojas

**Columnas requeridas por hoja:**
- `modelos`: modelo_id · tipo · nombre · descripcion_general · specs · imagen_principal
- `unidades`: unidad_id · modelo_id · color · capacidad · bateria · condicion · precio · descripcion_particular · disponible · imagen_url
- `banners`: name · description · subdescription · photo
- `config`: key · value

**Claves del tab config:**

| key | descripción | ejemplo |
|---|---|---|
| `store_name` | Nombre de la tienda (aparece en el navbar) | MotoStore |
| `hero_badge` | Texto pequeño arriba del título | Envíos a todo el país |
| `hero_title` | Primera línea del título grande | Accesorios de primera, |
| `hero_subtitle` | Segunda línea del título (en gris) | al mejor precio. |
| `hero_desc` | Párrafo debajo del título | Cascos, guantes y repuestos... |
| `whatsapp` | Número sin + ni espacios | 5491112345678 |

**Valores válidos:**
- `tipo`: iPhone · Mac · iPad · Accesorio
- `condicion`: Nuevo · Excelente · Muy bueno · Bueno
- `disponible`: TRUE · FALSE
- `bateria`: número entre 0 y 100

5. Borrar las filas de ejemplo y cargar los productos reales del cliente
6. Invitar al cliente como **Editor**: Compartir → agregar su Gmail

---

## Paso 5 — Google Sheets: configurar Apps Script

1. Extensiones → Apps Script
2. Borrar todo el contenido existente
3. Pegar el contenido de `scripts/sheets-setup.gs`
4. Guardar (Ctrl+S)

**Configurar propiedades de script:**

Configuración del proyecto (⚙️) → Propiedades de las secuencias de comandos → Agregar:

| Propiedad | Valor |
|---|---|
| `SUPABASE_URL` | URL del paso 1 |
| `SUPABASE_SERVICE_KEY` | Service key del paso 1 |
| `CLIENT_ID` | UUID del paso 3 |

**Configurar triggers:**

Activadores (reloj 🕐) → Agregar activador × 2:

| Función | Evento | Intervalo |
|---|---|---|
| `onEdit` | Desde la hoja de cálculo → Al editar | — |
| `checkAndSync` | Temporizador por minutos | Cada 5 minutos |

**Verificar:**
- Correr `syncAll` manualmente → debe completarse sin errores
- Editar una celda → esperar hasta 5 min → confirmar que aparece en Supabase

---

## Paso 6 — React: configurar variables de entorno

En el archivo `.env.local` del proyecto:

```
VITE_SUPABASE_URL=<URL del paso 1>
VITE_SUPABASE_ANON_KEY=<anon key del paso 1>
VITE_CLIENT_ID=<UUID del paso 3>
VITE_WHATSAPP=<número del cliente, ej: 5491112345678>
VITE_SUPABASE_IMAGE_BUCKET=pixel-gallery
VITE_ADMIN_EMAILS=maurolobo.ml@gmail.com
```

**Uploader interno de imagenes:**
- Ruta: `/admin/upload`
- Login: magic link de Supabase Auth
- Bucket recomendado: `pixel-gallery`
- Policies listas para pegar: `supabase/storage-policies.sql`

---

## Paso 7 — Vercel: deploy

1. Ir a https://vercel.com → Add New Project
2. Importar el repo `pixel` desde GitHub
3. En **Environment Variables** agregar las 4 variables del paso 6
4. Deploy

**Si el cliente ya tiene un proyecto en Vercel** (redeploy):
- Vercel → proyecto → Settings → Environment Variables → actualizar valores
- Deployments → Redeploy

---

## Paso 8 — Verificación final

- [ ] Abrir la URL de Vercel → se ve el catálogo
- [ ] Los productos del Sheet aparecen correctamente
- [ ] Editar un precio en el Sheet → en 5 min aparece actualizado en la web
- [ ] El botón de WhatsApp abre el número correcto

---

## Resumen de datos por cliente

Guardar esto para cada cliente:

```
Cliente:
Supabase URL:
Supabase anon key:
Supabase service key:
CLIENT_ID:
Google Sheet URL:
Vercel URL:
WhatsApp:
```
