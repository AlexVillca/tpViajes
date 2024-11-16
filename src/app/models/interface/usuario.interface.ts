export interface Usuario{
    id?:string,
    username: string,
    email: string,
    password: string,
    listasFavs: ListaFav[]
}
export interface ListaFav{
  idLista:string,
  nombreLista:string,
  listaCiudades:CiudadEnLista[]
}
export interface CiudadEnLista{
  codigoPais:string,
  nombre:string
}
