import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Usuario } from '../interface/usuario.interface';
import { catchError, map, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }

  private apiUrl = 'http://localhost:3000/usuarios';

  getUsuario(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => new Error('Error al obtener usuarios'));
      })
    );
  }

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario).pipe(
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return throwError(() => new Error('Error al crear usuario'));
      })
    );
  }

  putUsuario(usuario: Usuario): Observable<Usuario> {
    const url = `${this.apiUrl}/${usuario.id}`;
    return this.http.put<Usuario>(url, usuario).pipe(
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => new Error('Error al actualizar usuario'));
      })
    );
  }



logUsuario(nombreIngresado: string, contraseñaIngresada: string): Observable<number | null> {
    // En una aplicación real, usa una petición POST y cifra la contraseña
    const params = new HttpParams()
      .set('nombre', nombreIngresado)
      .set('contraseña', contraseñaIngresada);

      return this.http.get<Usuario>(this.apiUrl, { params }).pipe(
        map(usuario => usuario ? Number(usuario.id) : null),
        catchError(error => {
          console.error('Error during login:', error);
          return of(null);
        })
    );
  }
}
