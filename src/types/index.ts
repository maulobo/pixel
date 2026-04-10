export interface Modelo {
  modelo_id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_principal: string;
  imagen_2: string | null;
  imagen_3: string | null;
}

export interface Unidad {
  unidad_id: string;
  modelo_id: string;
  disponible: boolean;
  atributos: Record<string, string>;
  imagen_1: string | null;
  imagen_2: string | null;
  imagen_3: string | null;
}

export interface UnidadConModelo extends Unidad {
  modelo: Modelo;
}

export interface CartLine {
  unidad_id: string;
}

export interface Banner {
  titulo: string;
  subtitulo: string;
  foto: string;
}

export interface Categoria {
  nombre: string;
  imagen: string | null;
}

export interface SiteConfig {
  nombre_tienda: string;
  hero_badge: string;
  hero_titulo: string;
  hero_subtitulo: string;
  whatsapp: string;
  instagram: string;
  email: string;
  color_primario: string;
  variante_keys: string[];
  variante_labels: Record<string, string>;
  categorias: Categoria[];
  banners: Banner[];
}

export interface ModeloGroup {
  modelo: Modelo;
  unidades: UnidadConModelo[];
}
