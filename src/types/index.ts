export interface Modelo {
  modelo_id: string
  tipo: string
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

export interface Banner {
  name: string
  description: string
  subdescription: string
  photo: string
}
