// paises/pais.interface.ts
export interface Pais {
  nombre: string;
  nombreOficial?: string;
  capital?: string;
  codigo?: string;
  latitud?: number;
  longitud?: number;
  bandera?: string;
  idiomaOficial?: string;
  moneda?: string;
  continente?: string;
  visa?: {
    necesaria: boolean;
    descripcion: string;
  };
  clima?: string;
  gastronomia?: string;
  cultura?: string;
  seguridad?: string;
  transporte?: string;
  ciudades?: Ciudad[];
}

export interface Ciudad {
  nombre: string;
  infoWikipedia?: string;
  actividades?: string;
  consejos?: string;
  comentarios?: string;
  atracciones?: Atraccion[];
}

export interface Atraccion {
  nombre: string;
  descripcion?: string;
  imagen?: string;
  horario?: string;
  paginaWeb?: string;
  ubicacion?: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
  tipo?: string;
  valoracion?: number;
}
