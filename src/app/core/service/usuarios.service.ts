import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ListaFav, Usuario } from '../../models/interface/usuario.interface';
import { catchError, concatMap, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { IdUsuarioService } from './id-usuario.service';


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
      map(usuario => usuario.listasFavs),

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


}



