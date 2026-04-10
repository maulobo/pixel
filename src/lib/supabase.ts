import { createClient } from "@supabase/supabase-js";
import type { Banner, Categoria, SiteConfig, UnidadConModelo } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID?.trim();
export const IMAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_IMAGE_BUCKET ?? "product-images";
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !CLIENT_ID) {
  throw new Error("Missing Supabase env vars");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { CLIENT_ID };

async function logMissingClientContext(table: string) {
  if (!import.meta.env.DEV) return;

  const { data, error } = await supabase
    .from(table)
    .select("client_id")
    .limit(5);

  if (error) {
    console.warn(`[${table}] debug client_id lookup failed:`, error.message);
    return;
  }

  const sampleClientIds = [...new Set((data ?? []).map((row) => row.client_id))];
  console.warn(
    `[${table}] no rows for client_id="${CLIENT_ID}" (length=${CLIENT_ID.length}). sample client_ids in table:`,
    sampleClientIds,
  );
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeCatalogRow(item: Record<string, unknown>): UnidadConModelo {
  const rawAtributos =
    item.atributos && typeof item.atributos === "object" && !Array.isArray(item.atributos)
      ? (item.atributos as Record<string, unknown>)
      : {};
  const atributos = Object.fromEntries(
    Object.entries(rawAtributos).flatMap(([key, value]) =>
      value == null ? [] : [[key, String(value)]],
    ),
  ) as Record<string, string>;

  const color = asNonEmptyString(item.color) ?? atributos.color;
  const capacidad = asNonEmptyString(item.capacidad) ?? atributos.capacidad;
  const bateria =
    asNumber(item.bateria)?.toString() ??
    asNonEmptyString(rawAtributos.bateria) ??
    atributos.bateria;
  const condicion = asNonEmptyString(item.condicion) ?? atributos.condicion;
  const descripcionParticular =
    asNonEmptyString(item.descripcion_particular) ?? atributos.descripcion_particular;
  const precio =
    asNumber((item.modelo as { precio?: unknown } | null | undefined)?.precio) ??
    asNumber(item.precio) ??
    asNumber(rawAtributos.precio) ??
    0;
  const modelo = (item.modelo as Record<string, unknown> | null | undefined) ?? {};

  return {
    ...(item as unknown as UnidadConModelo),
    atributos: {
      ...atributos,
      ...(color ? { color } : {}),
      ...(capacidad ? { capacidad } : {}),
      ...(bateria ? { bateria } : {}),
      ...(condicion ? { condicion } : {}),
      ...(descripcionParticular ? { descripcion_particular: descripcionParticular } : {}),
      ...(precio > 0 ? { precio: String(precio) } : {}),
    },
    imagen_1: asNonEmptyString(item.imagen_1) ?? asNonEmptyString(item.imagen_url) ?? null,
    imagen_2: asNonEmptyString(item.imagen_2) ?? null,
    imagen_3: asNonEmptyString(item.imagen_3) ?? null,
    modelo: {
      ...(modelo as unknown as UnidadConModelo["modelo"]),
      descripcion:
        asNonEmptyString(modelo.descripcion) ??
        asNonEmptyString(modelo.descripcion_general) ??
        descripcionParticular ??
        "",
      precio,
      imagen_principal:
        asNonEmptyString(modelo.imagen_principal) ??
        asNonEmptyString(item.imagen_1) ??
        asNonEmptyString(item.imagen_url) ??
        "",
      imagen_2:
        asNonEmptyString(modelo.imagen_2) ?? asNonEmptyString(modelo.segunda_img) ?? null,
      imagen_3: asNonEmptyString(modelo.imagen_3) ?? null,
    },
  };
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function signInAdmin(email: string) {
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/upload`,
    },
  });

  if (error) throw new Error(error.message);
}

export async function signOutAdmin() {
  const { error } = await supabaseAdmin.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function uploadAdminImage(file: File, folder = "misc") {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeFolder = folder.trim().toLowerCase().replace(/[^a-z0-9/-]+/g, "-");
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const path = `${CLIENT_ID}/${safeFolder || "misc"}/${Date.now()}-${safeName || "image"}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

export async function fetchCatalog(): Promise<UnidadConModelo[]> {
  const { data, error } = await supabase
    .from("unidades")
    .select("*, modelo:modelos(*)")
    .eq("client_id", CLIENT_ID)
    .eq("disponible", true);

  if (error) {
    console.error("[fetchCatalog] error:", error);
    throw new Error(`fetchCatalog failed: ${error.message}`);
  }

  console.log("[fetchCatalog] rows:", data?.length, data?.[0]);
  if ((data?.length ?? 0) === 0) {
    void logMissingClientContext("unidades");
  }
  return (data ?? []).map((item) =>
    normalizeCatalogRow(item as Record<string, unknown>),
  );
}

const DEFAULT_CONFIG: SiteConfig = {
  nombre_tienda: "Pixel",
  hero_badge: "",
  hero_titulo: "Productos de primera,",
  hero_subtitulo: "al mejor precio.",
  whatsapp: "",
  instagram: "",
  email: "",
  color_primario: "#0a84ff",
  variante_keys: [],
  variante_labels: {},
  categorias: [] as Categoria[],
  banners: [],
};

export async function fetchCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("nombre, imagen")
    .eq("client_id", CLIENT_ID)
    .eq("web", true)
    .order("orden");

  if (error || !data) {
    console.error("[fetchCategorias] error:", error);
    return [];
  }
  console.log("[fetchCategorias] rows:", data);
  if (data.length === 0) {
    void logMissingClientContext("categorias");
  }
  return data as Categoria[];
}

export async function fetchConfig(): Promise<SiteConfig> {
  const { data, error } = await supabase
    .from("config")
    .select("key, value")
    .eq("client_id", CLIENT_ID);

  if (error || !data) {
    console.error("[fetchConfig] error:", error);
    return DEFAULT_CONFIG;
  }
  console.log("[fetchConfig] rows:", data?.length);
  if (data.length === 0) {
    void logMissingClientContext("config");
  }

  const map = Object.fromEntries(
    data.map((r: { key: string; value: string }) => [r.key, r.value]),
  );

  const bannerIndexes = Array.from(
    new Set(
      Object.keys(map)
        .map((k) => k.match(/^banner_(\d+)_/)?.[1])
        .filter(Boolean),
    ),
  )
    .map(Number)
    .sort((a, b) => a - b);

  const banners: Banner[] = bannerIndexes
    .filter((n) => map[`banner_${n}_foto`] || map[`banner_${n}_titulo`])
    .map((n) => ({
      foto: map[`banner_${n}_foto`] ?? "",
      titulo: map[`banner_${n}_titulo`] ?? "",
      subtitulo: map[`banner_${n}_subtitulo`] ?? "",
    }));

  const varianteKeys = map["variante_keys"]
    ? map["variante_keys"].split("|").map((k: string) => k.trim()).filter(Boolean)
    : [];

  const varianteLabels: Record<string, string> = {};
  if (map["variante_labels"]) {
    map["variante_labels"].split("|").forEach((label: string, i: number) => {
      if (varianteKeys[i]) varianteLabels[varianteKeys[i]] = label.trim();
    });
  }

  return {
    ...DEFAULT_CONFIG,
    ...map,
    variante_keys: varianteKeys,
    variante_labels: varianteLabels,
    categorias: DEFAULT_CONFIG.categorias,
    banners,
  };
}

export async function fetchUnidad(
  unidadId: string,
): Promise<UnidadConModelo | null> {
  const { data, error } = await supabase
    .from("unidades")
    .select("*, modelo:modelos(*)")
    .eq("client_id", CLIENT_ID)
    .eq("unidad_id", unidadId)
    .single();

  if (error) return null;

  return normalizeCatalogRow(data as Record<string, unknown>);
}
