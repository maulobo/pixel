-- =============================================================
-- PIXEL — Schema + RLS
-- Correr en Supabase > SQL Editor al crear un proyecto nuevo.
-- =============================================================

-- ─── TABLAS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS modelos (
  client_id         UUID        NOT NULL,
  modelo_id         TEXT        NOT NULL,
  categoria         TEXT        NOT NULL,
  nombre            TEXT        NOT NULL,
  descripcion_general TEXT,
  specs             TEXT,
  imagen_principal  TEXT,
  PRIMARY KEY (modelo_id, client_id)
);

CREATE TABLE IF NOT EXISTS unidades (
  client_id             UUID        NOT NULL,
  unidad_id             TEXT        NOT NULL,
  modelo_id             TEXT        NOT NULL,
  color                 TEXT,
  capacidad             TEXT,
  bateria               INTEGER,
  condicion             TEXT,
  precio                NUMERIC,
  descripcion_particular TEXT,
  disponible            BOOLEAN     DEFAULT true,
  imagen_url            TEXT,
  PRIMARY KEY (unidad_id, client_id)
);

-- Banners eliminados: ahora se gestionan como claves en la tabla config
-- (banner_N_foto, banner_N_titulo, banner_N_subtitulo)
DROP TABLE IF EXISTS banners;

CREATE TABLE IF NOT EXISTS categorias (
  client_id  UUID     NOT NULL,
  nombre     TEXT     NOT NULL,
  orden      INTEGER  DEFAULT 0,
  web        BOOLEAN  DEFAULT true,
  PRIMARY KEY (nombre, client_id)
);

CREATE TABLE IF NOT EXISTS tradein_modelos (
  client_id   UUID     NOT NULL,
  modelo      TEXT     NOT NULL,
  precio_base NUMERIC  NOT NULL,
  PRIMARY KEY (modelo, client_id)
);

CREATE TABLE IF NOT EXISTS tradein_ajustes (
  client_id     UUID     NOT NULL,
  tipo          TEXT     NOT NULL,
  nombre        TEXT     NOT NULL,
  multiplicador NUMERIC  NOT NULL,
  orden         INTEGER  DEFAULT 0,
  PRIMARY KEY (tipo, nombre, client_id)
);

-- ─── RLS ─────────────────────────────────────────────────────
-- La anon key (frontend) solo puede leer.
-- La service key (Apps Script) bypasea RLS y puede escribir todo.

ALTER TABLE modelos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Lectura pública (catálogo sin auth)
DROP POLICY IF EXISTS "anon read" ON modelos;
DROP POLICY IF EXISTS "anon read" ON unidades;
DROP POLICY IF EXISTS "anon read" ON categorias;
CREATE POLICY "anon read" ON modelos    FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON unidades   FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON categorias FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "authenticated read" ON modelos;
DROP POLICY IF EXISTS "authenticated read" ON unidades;
DROP POLICY IF EXISTS "authenticated read" ON categorias;
CREATE POLICY "authenticated read" ON modelos    FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON unidades   FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON categorias FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS config (
  client_id   UUID  NOT NULL,
  key         TEXT  NOT NULL,
  value       TEXT,
  PRIMARY KEY (key, client_id)
);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read" ON config;
CREATE POLICY "anon read" ON config FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "authenticated read" ON config;
CREATE POLICY "authenticated read" ON config FOR SELECT TO authenticated USING (true);

-- ─── ÍNDICES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_unidades_modelo_id  ON unidades (modelo_id, client_id);
CREATE INDEX IF NOT EXISTS idx_unidades_disponible ON unidades (disponible, client_id);
CREATE INDEX IF NOT EXISTS idx_categorias_orden    ON categorias (client_id, orden);

ALTER TABLE tradein_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradein_ajustes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read" ON tradein_modelos;
DROP POLICY IF EXISTS "anon read" ON tradein_ajustes;
CREATE POLICY "anon read" ON tradein_modelos FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON tradein_ajustes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "authenticated read" ON tradein_modelos;
DROP POLICY IF EXISTS "authenticated read" ON tradein_ajustes;
CREATE POLICY "authenticated read" ON tradein_modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON tradein_ajustes FOR SELECT TO authenticated USING (true);
