import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ListaFav, Usuario } from '../../models/interface/usuario.interface';
import { catchError, concatMap, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }

  private apiUrl = environment.urlBaseUsuarios;

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }


  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getUsuarioById(id:string):Observable<Usuario>{
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }
  logUsuario(emailIngresado: string, contraseñaIngresada: string): Observable<string|null> {
    const params = new HttpParams()
      .set('email', emailIngresado)
      .set('password', contraseñaIngresada);
    return this.http.get<Usuario[]>(this.apiUrl, { params }).pipe(
      map(usuario => {
        if (usuario) {
          return String(usuario[0].id);
        } else {
          console.log("contraseña incorrecta");
          return null;
        }
      })
    );
  }

comprobarEmailUsuario(emailIngresado: string): Observable<boolean> {
  return this.http.get<Usuario | null>(`${this.apiUrl}?email=${encodeURIComponent(emailIngresado)}`).pipe(
    map(usuario => {

      return usuario === null || Object.keys(usuario).length === 0;
    })
  );
}
comprobarUserNameUsuario(usernameIngresado: string): Observable<boolean> {


  return this.http.get<Usuario | null>(`${this.apiUrl}?username=${encodeURIComponent(usernameIngresado)}`).pipe(
    map(usuario => {

      return usuario === null || Object.keys(usuario).length === 0;
    })
  );
}
obtenerListasFav(id:string):Observable<ListaFav[]>{
  return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
    map(usuario => usuario.listasFavs),

  );
}
actualizarUsuario(aActualizar:Usuario):Observable<Usuario>{

  const url = `${this.apiUrl}/${aActualizar.id}`;

  return this.http.put<Usuario>(url, aActualizar);

  }










}



