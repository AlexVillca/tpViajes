import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListaFav, Usuario } from '../../models/interface/usuario.interface';
import { IdUsuarioService, SessionUser } from './id-usuario.service';
import { buildHttpError } from '../utils/http-error.util';

interface RespuestaSesion {
  user: SessionUser;
}

/** El nombre de usuario o el email que se quiso guardar ya pertenece a otra cuenta. */
export class ErrorDatoEnUso extends Error {
  constructor(readonly campo: 'username' | 'email') {
    super(campo === 'email' ? 'mensajes.emailEnUso' : 'mensajes.usuarioEnUso');
  }
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }
  idUs = inject(IdUsuarioService);
  private apiUrl = `${environment.apiBaseUrl}/usuarios`;

  postUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario).pipe(
      catchError(error => buildHttpError(error, 'mensajes.registrarUsuario'))
    );
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => buildHttpError(error, 'mensajes.cargarUsuarios'))
    );
  }

  getUsuarioById(id: string | null): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => buildHttpError(error, 'mensajes.obtenerUsuario'))
    );
  }

  /** Inicia sesión con email o nombre de usuario. El backend deja el token en una cookie httpOnly. */
  login(usuario: string, password: string): Observable<boolean | null> {
    const url = `${environment.apiBaseUrl}/login`;

    return this.http
      .post<RespuestaSesion>(url, { usuario: usuario.trim(), password })
      .pipe(
        map(respuesta => {
          this.idUs.setSession(respuesta.user);
          return true;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          if (error.status === 401) {
            return of(false);
          }
          return buildHttpError(error, 'mensajes.iniciarSesion');
        })
      );
  }

  /** Cierra la sesión en el backend (borra la cookie) y en la interfaz, aunque el backend no responda. */
  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/logout`, {}).pipe(
      catchError(() => of(undefined)),
      map(() => this.idUs.clearUserId())
    );
  }

  /**
   * Confirma con el backend que la cookie de sesión sigue vigente y actualiza los datos locales.
   * Si venció, cierra la sesión local; si el backend no responde, deja todo como estaba.
   */
  verificarSesion(): Observable<SessionUser | null> {
    return this.http.get<RespuestaSesion>(`${environment.apiBaseUrl}/sesion`).pipe(
      map(respuesta => {
        this.idUs.setSession(respuesta.user);
        return respuesta.user;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.idUs.clearUserId();
        }
        return of(this.idUs.currentSession);
      })
    );
  }

  /** Cambia nombre de usuario y/o email. Ante un dato repetido devuelve el campo en conflicto. */
  actualizarPerfil(cambios: { username?: string; email?: string }): Observable<SessionUser> {
    return this.http.patch<RespuestaSesion>(`${environment.apiBaseUrl}/perfil`, cambios).pipe(
      map(respuesta => {
        this.idUs.setSession(respuesta.user);
        return respuesta.user;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          const campo = error.error?.campo === 'email' ? 'email' : 'username';
          return throwError(() => new ErrorDatoEnUso(campo));
        }
        return buildHttpError(error, 'mensajes.guardarPerfil');
      })
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
      catchError(error => buildHttpError(error, 'mensajes.validarEmail'))
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
      catchError(error => buildHttpError(error, 'mensajes.validarUsuario'))
    );
  }

  obtenerListasFav(id: string): Observable<ListaFav[]> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      map(usuario => usuario.listasFavs),
      catchError(error => buildHttpError(error, 'mensajes.cargarListasFavoritos'))
    );
  }

  obtenerListaFav(idUsuario: string, idListaBuscada: string): Observable<ListaFav | undefined> {
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.find(l => l.idLista === idListaBuscada)),
      catchError(error => buildHttpError(error, 'mensajes.cargarListaSeleccionada'))
    );
  }

  actualizarListasFavoritos(id: string, listasActualizadas: ListaFav[]): Observable<ListaFav[]> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { listasFavs: listasActualizadas };

    return this.http.patch<Usuario>(url, body).pipe(
      map(usuario => usuario.listasFavs),
      catchError(error => buildHttpError(error, 'mensajes.guardarFavoritos'))
    );
  }

  cambiarContrasena(id: string, nuevaContrasena: string): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { password: nuevaContrasena };
    return this.http.patch<Partial<Usuario>>(url, body).pipe(
      catchError(error => buildHttpError(error, 'mensajes.actualizarContrasena'))
    );
  }

  actualizarPuntajeMaximo(id: String, puntajeNuevo: number): Observable<Partial<Usuario>> {
    const url = `${this.apiUrl}/${id}`;
    const body: Partial<Usuario> = { mejorPuntaje: puntajeNuevo };
    return this.http.patch<Partial<Usuario>>(url, body).pipe(
      catchError(error => buildHttpError(error, 'mensajes.actualizarPuntaje'))
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
      catchError(error => buildHttpError(error, 'mensajes.actualizarLista'))
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
      catchError(error => buildHttpError(error, 'mensajes.eliminarListaFavoritos'))
    );
  }

  comprobarNombreExistenteDeLista(idUsuario: string, nombreComprobar: string): Observable<boolean> {
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}`).pipe(
      map(usuario => usuario.listasFavs.some(l => l.nombreLista === nombreComprobar) ?? false),
      catchError(error => buildHttpError(error, 'mensajes.validarNombreLista'))
    );
  }
}
