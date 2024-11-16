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

  getUsuarioById(id:string | null):Observable<Usuario>{
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  logUsuario(emailIngresado: string, contraseñaIngresada: string): Observable<string|null> {
    const params = new HttpParams()
      .set('email', emailIngresado)
      .set('password', contraseñaIngresada);
    return this.http.get<Usuario[]>(this.apiUrl, { params }).pipe(
      map(usuario => {
        if (usuario) {
          if(usuario[0].password === contraseñaIngresada){
            return String(usuario[0].id);
          }else{
            return null;
          }
        } else {
          console.log("contraseña incorrecta");
          return null;
        }
      })
    );
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

putUsuario(usuario: Usuario, id: string): Observable<Usuario>{
  return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario)
}




actualizarUsuario(aActualizar:Usuario):Observable<Usuario>{

  const url = `${this.apiUrl}/${aActualizar.id}`;

  return this.http.put<Usuario>(url, aActualizar);

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



