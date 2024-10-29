import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Usuario } from '../../models/interface/usuario.interface';
import { catchError, map, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }

  private apiUrl = 'http://localhost:3000/usuarios';

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario).pipe(
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return throwError(() => new Error('Error al crear usuario'));
      })
    );
  }


  getUsuario(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => new Error('Error al obtener usuarios'));
      })
    );
  }


  putUsuario(usuario: Usuario): Observable<Usuario> {
    const url = `${this.apiUrl}/${usuario.email}`;
    return this.http.put<Usuario>(url, usuario).pipe(
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => new Error('Error al actualizar usuario'));
      })
    );
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
      }),
      catchError(error => {
        console.error('Error durante el login:', error);
        return throwError(() => error.message || 'Error de red');
      })
    );
  }

  comprobarEmailUsuario(emailIngresado: string): Observable<boolean> {
  const params = new HttpParams().set('email', emailIngresado);

    return this.http.get<Usuario>(this.apiUrl, { params }).pipe(
    map(usuario => {
      if (usuario) {
        return false;
      }

      return true;
    }),
    catchError(error => {
      console.error('Error during email check:', error);

      return of(true);
    })
  );
}

comprobarNombreUsuario(nombreIngresado: string): Observable<boolean> {
  const params = new HttpParams().set('email', nombreIngresado);

  return this.http.get<Usuario>(this.apiUrl, { params }).pipe(
    map(usuario => {
      if (usuario) {

        return false;
      }

      return true;
    }),
    catchError(error => {
      console.error('Error during email check:', error);

      return of(true);
    })
  );
}

}

