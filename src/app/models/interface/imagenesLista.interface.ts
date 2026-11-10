import { CiudadEnLista } from "./usuario.interface"

export interface ImagenesLista{
  id:string,
  nombre:string,
  imagenes:string[]
}

export interface ImagenesCiudad{
  ciudad:CiudadEnLista
  /** Nombre de la ciudad en inglés, si la base lo tiene. */
  nombreEn?: string
  imagenes:string[]
}
