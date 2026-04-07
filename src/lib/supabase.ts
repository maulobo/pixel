import { createClient } from "@supabase/supabase-js";
import type { Banner, SiteConfig, UnidadConModelo } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
export const IMAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_IMAGE_BUCKET ?? "product-images";
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !CLIENT_ID) {
  throw new Error("Missing Supabase env vars");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { CLIENT_ID };

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function signInAdmin(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/upload`,
    },
  });

  if (error) throw new Error(error.message);
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
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

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

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

  if (error) throw new Error(`fetchCatalog failed: ${error.message}`);

  return (data ?? []) as UnidadConModelo[];
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
  categorias: [],
  banners: [],
};

export async function fetchCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("client_id", CLIENT_ID)
    .eq("web", true)
    .order("orden");

  if (error || !data) return [];
  return data.map((r: { nombre: string }) => r.nombre);
}

export async function fetchConfig(): Promise<SiteConfig> {
  const { data, error } = await supabase
    .from("config")
    .select("key, value")
    .eq("client_id", CLIENT_ID);

  if (error || !data) return DEFAULT_CONFIG;

  const map = Object.fromEntries(
    data.map((r: { key: string; value: string }) => [r.key, r.value]),
  );

  // Parsear banners desde claves banner_N_foto / banner_N_titulo / banner_N_subtitulo
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

  return {
    ...DEFAULT_CONFIG,
    ...map,
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

  return data as UnidadConModelo;
}
