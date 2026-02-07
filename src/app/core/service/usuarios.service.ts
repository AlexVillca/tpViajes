import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, concatMap, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { IdUsuarioService } from './id-usuario.service';
import { Pais } from '../../models/interface/pais.interface';
import { ImagenesLista } from '../../models/interface/imagenesLista.interface';
import { ListaFav, Usuario } from '../../models/interface/usuario.interface';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }
  idUs = inject(IdUsuarioService);
  private apiUrl = environment.urlBaseUsuarios;

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }


  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getUsuarioById(id:string | null):Observable<Usuario>{
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  login(username:string,password:string):Observable<boolean|null>{
    return this.http.get<Usuario[]>(`${this.apiUrl}?email=${username}`).pipe(map(
        response => {
          if(response.length === 0){
            return null;
          }else{
            if(response[0].password === password){
              if(response[0].id !== undefined){
                this.idUs.setId(response[0].id);
              }



              return true;
            }else{
              return false;
            }
          }
        }
    ))
  }

  comprobarEmailUsuario(emailIngresado: string): Observable<boolean> {
    return this.http.get<Usuario[]|undefined>(this.apiUrl).pipe(
      map(usuarios => {
        if(usuarios){
          if (usuarios?.find(u => u.email === emailIngresado) !== undefined) {
            return false;
          } else {
            return true;
          }
        }else{
          return false;
        }
      })
    );
  }
  comprobarUserNameUsuario(usernameIngresado: string): Observable<boolean> {

    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      map(usuarios => {
        if(usuarios){
          if (usuarios?.find(u => u.username === usernameIngresado) !== undefined) {
            return false;
          } else {
            return true;
          }
        }else{
          return false;
        }
      })
    );
  }
  obtenerListasFav(id:string):Observable<ListaFav[]>{
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      map(usuario => usuario.listasFavs)

    );
  }
   obtenerListaFav(idUsuario:string,idListaBuscada:string):Observable<ListaFav | undefined>{
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.find(l => l.idLista === idListaBuscada))
    );
  }

  actualizarListasFavoritos(id:string, listasActualizadas:ListaFav[]):Observable<Partial<Usuario>> {
      const url = `${this.apiUrl}/${id}`;
      const body: Partial<Usuario> = { listasFavs: listasActualizadas };
      return this.http.patch<Partial<Usuario>>(url, body);

  }



  cambiarContrasena(id: string, nuevaContrasena: string): Observable<Partial<Usuario>> {
      const url = `${this.apiUrl}/${id}`;
      const body: Partial<Usuario> = { password: nuevaContrasena };
      return this.http.patch<Partial<Usuario>>(url, body);
  }

  actualizarPuntajeMaximo(id: String, puntajeNuevo: number):Observable<Partial<Usuario>>{
      const url = `${this.apiUrl}/${id}`;
      const body: Partial<Usuario> = { mejorPuntaje: puntajeNuevo };
      return this.http.patch<Partial<Usuario>>(url, body);
  }




  actualizarListaFavoritos(idUsuario: string, listaActualizada: ListaFav): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.get<Usuario>(url).pipe(
      map(usuario => {

          const listasActualizadas = usuario.listasFavs.map(listaActual =>
            listaActual.idLista === listaActualizada.idLista ? listaActualizada : listaActual
          );

          return { listasFavs: listasActualizadas } as Partial<Usuario>;
        }
      ),
      switchMap(body => this.http.patch<Partial<Usuario>>(url, body))
    );
  }

  eliminarListaFavoritos(idListaEliminar:string,idUsuario:string):Observable<Partial<Usuario>>{
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.get<Usuario>(url).pipe(
      map(usuario => {
          const listasActualizadas = usuario.listasFavs.filter(l => l.idLista !== idListaEliminar);
          return { listasFavs: listasActualizadas } as Partial<Usuario>;
        }
      ),
      switchMap(body => this.http.patch<Partial<Usuario>>(url, body))
    );
  }

  comprobarNombreExistenteDeLista(idUsuario:string,nombreComprobar:string):Observable<boolean>{
     return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.some(l => l.nombreLista === nombreComprobar) ?? false)
    );
  }


}



