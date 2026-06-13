import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListaFav, Usuario } from '../../models/interface/usuario.interface';
import { IdUsuarioService } from './id-usuario.service';
import { buildHttpError } from '../utils/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }
  idUs = inject(IdUsuarioService);
  // La URL se arma desde una sola base comun a toda la app.
  private apiUrl = `${environment.apiBaseUrl}/usuarios`;

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario).pipe(
      catchError(error => buildHttpError(error, 'No se pudo registrar el usuario.'))
    );
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => buildHttpError(error, 'No se pudieron cargar los usuarios.'))
    );
  }

  getUsuarioById(id: string | null): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => buildHttpError(error, 'No se pudo obtener el usuario.'))
    );
  }

  login(username: string, password: string): Observable<boolean | null> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?email=${username}`).pipe(
      map(response => {
        if (response.length === 0) {
          return null;
        }

        const user = response[0];

        // Mientras sigamos con json-server, la validacion sigue del lado del frontend.
        if (user.password === password) {
          if (user.id !== undefined) {
            // Guardamos una sesion minima reutilizable por toda la app.
            this.idUs.setSession({
              id: user.id,
              username: user.username,
              email: user.email
            });
          }

          return true;
        }

        return false;
      }),
      catchError(error => buildHttpError(error, 'No se pudo iniciar sesión.'))
    );
  }

  comprobarEmailUsuario(emailIngresado: string): Observable<boolean> {
    return this.http.get<Usuario[] | undefined>(this.apiUrl).pipe(
      map(usuarios => {
        if (usuarios) {
          if (usuarios.find(u => u.email === emailIngresado) !== undefined) {
            return false;
          }

          return true;
        }

        return false;
      }),
      catchError(error => buildHttpError(error, 'No se pudo validar el email ingresado.'))
    );
  }

  comprobarUserNameUsuario(usernameIngresado: string): Observable<boolean> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      map(usuarios => {
        if (usuarios) {
          if (usuarios.find(u => u.username === usernameIngresado) !== undefined) {
            return false;
          }

          return true;
        }

        return false;
      }),
      catchError(error => buildHttpError(error, 'No se pudo validar el nombre de usuario ingresado.'))
    );
  }

  obtenerListasFav(id: string): Observable<ListaFav[]> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      map(usuario => usuario.listasFavs),
      catchError(error => buildHttpError(error, 'No se pudieron cargar las listas de favoritos.'))
    );
  }

  obtenerListaFav(idUsuario: string, idListaBuscada: string): Observable<ListaFav | undefined> {
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.find(l => l.idLista === idListaBuscada)),
      catchError(error => buildHttpError(error, 'No se pudo cargar la lista seleccionada.'))
    );
  }

  actualizarListasFavoritos(id: string, listasActualizadas: ListaFav[]): Observable<ListaFav[]> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { listasFavs: listasActualizadas };

    return this.http.patch<Usuario>(url, body).pipe(
      map(usuario => usuario.listasFavs),
      catchError(error => buildHttpError(error, 'No se pudieron guardar los favoritos.'))
    );
  }

  cambiarContrasena(id: string, nuevaContrasena: string): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { password: nuevaContrasena };
    return this.http.patch<Partial<Usuario>>(url, body).pipe(
      catchError(error => buildHttpError(error, 'No se pudo actualizar la contraseña.'))
    );
  }

  actualizarPuntajeMaximo(id: String, puntajeNuevo: number): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { mejorPuntaje: puntajeNuevo };
    return this.http.patch<Partial<Usuario>>(url, body).pipe(
      catchError(error => buildHttpError(error, 'No se pudo actualizar el mejor puntaje.'))
    );
  }

  actualizarListaFavoritos(idUsuario: string, listaActualizada: ListaFav): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.get<Usuario>(url).pipe(
      map(usuario => {
        const listasActualizadas = usuario.listasFavs.map(listaActual =>
          listaActual.idLista === listaActualizada.idLista ? listaActualizada : listaActual
        );

        return { listasFavs: listasActualizadas } as Partial<Usuario>;
      }),
      switchMap(body => this.http.patch<Partial<Usuario>>(url, body)),
      catchError(error => buildHttpError(error, 'No se pudo actualizar la lista de favoritos.'))
    );
  }

  eliminarListaFavoritos(idListaEliminar: string, idUsuario: string): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.get<Usuario>(url).pipe(
      map(usuario => {
        const listasActualizadas = usuario.listasFavs.filter(l => l.idLista !== idListaEliminar);
        return { listasFavs: listasActualizadas } as Partial<Usuario>;
      }),
      switchMap(body => this.http.patch<Partial<Usuario>>(url, body)),
      catchError(error => buildHttpError(error, 'No se pudo eliminar la lista de favoritos.'))
    );
  }

  comprobarNombreExistenteDeLista(idUsuario: string, nombreComprobar: string): Observable<boolean> {
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.some(l => l.nombreLista === nombreComprobar) ?? false),
      catchError(error => buildHttpError(error, 'No se pudo validar el nombre de la lista.'))
    );
  }
}
