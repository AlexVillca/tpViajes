import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Usuario } from '../interface/usuario.interface';
import { catchError, map, Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  
  constructor(private http:HttpClient) { }
  //http2 = inject(HttpClient)

  urlBase: string = 'http://localhost:3000/usuarios'

  getUsuario(): Observable<Usuario[]>{
    return this.http.get<Usuario[]>(this.urlBase)
  }
  postUsuario(usuario:Usuario): Observable<Usuario>{
    return this.http.post<Usuario>(this.urlBase,usuario);
  }
  putUsuario(usuario:Usuario): Observable<Usuario>{
    return this.http.put<Usuario>(`${this.urlBase}/${usuario}`,usuario);
  }

/*
  logUsuario(nombreIngresado: string,contraseñaIngresada: string): Observable<Usuario>{
    const params = new HttpParams()
    .set('nombre', nombreIngresado)
    .set('contraseña', contraseñaIngresada);
    return this.http.get<Usuario>(this.urlBase, { params });
  }
*/
 


  logUsuario(nombreIngresado: string, contraseñaIngresada: string): Observable<number | null> {
    const params = new HttpParams()
      .set('nombre', nombreIngresado)
      .set('contraseña', contraseñaIngresada);
    
    return this.http.get<Usuario>(this.urlBase, { params }).pipe(
      map(usuario => usuario ? usuario.id : null),
      catchError(() => of(null)) // Maneja el error y devuelve null
    );
  }
}
