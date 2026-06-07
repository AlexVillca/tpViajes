import { CiudadEnLista } from "./usuario.interface"

export interface ImagenesLista{
  id:string,
  nombre:string,
  imagenes:string[]
}

export interface ImagenesCiudad{
  ciudad:CiudadEnLista
  imagenes:string[]
}
