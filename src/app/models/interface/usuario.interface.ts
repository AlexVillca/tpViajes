export interface Usuario{
    id?:string,
    username: string,
    email: string,
    password: string
    listasFavs: ListaFav[]
}
export interface ListaFav{
  nombreLista:string,
  listaCiudades:CiudadEnLista[]
}
export interface CiudadEnLista{
  idPais:string,
  nombreCiudad:string
}
