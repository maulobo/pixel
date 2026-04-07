export interface Modelo {
  modelo_id: string;
  categoria: string;
  nombre: string;
  descripcion_general: string;
  specs: string;
  imagen_principal: string;
}

export interface Unidad {
  unidad_id: string;
  modelo_id: string;
  color: string;
  capacidad: string;
  bateria: number;
  condicion: string;
  precio: number;
  descripcion_particular: string;
  disponible: boolean;
  imagen_url: string;
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

export interface SiteConfig {
  nombre_tienda: string;
  hero_badge: string;
  hero_titulo: string;
  hero_subtitulo: string;
  whatsapp: string;
  instagram: string;
  email: string;
  color_primario: string;
  categorias: string[];
  banners: Banner[];
}

export interface ModeloGroup {
  modelo: Modelo;
  unidades: UnidadConModelo[];
}
