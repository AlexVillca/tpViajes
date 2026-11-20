import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';
import { Pais } from '../../models/interface/pais.interface';

export interface ResumenAdmin {
  usuarios: number;
  comentarios: number;
  valoraciones: number;
  paises: number;
  paisesOcultos: number;
}

export interface ComentarioAdmin {
  id: string;
  mensaje: string;
  ciudad: string;
  usuario: string;
  usuarioId: string;
  paisId: string | null;
  pais: string | null;
  fecha: string;
}

export interface AccionRegistro {
  id: string;
  usuario: string;
  accion: string;
  objetivo: string;
  detalle: unknown;
  fecha: string;
}

/** Cambios que acepta el backend para un país (todos opcionales). */
export type CambiosPais = Partial<Pick<Pais, 'nombre' | 'nombreOficial' | 'capital' | 'idiomaOficial' | 'moneda' | 'continente' |
  'clima' | 'gastronomia' | 'cultura' | 'seguridad' | 'transporte' | 'visible' | 'ciudades'>>;

// Un 400 del backend trae un texto que dice qué dato no es válido: se muestra ese texto.
function errorAdmin(error: HttpErrorResponse, clave: string) {
  const detalle = error.error?.error;
  if (error.status === 400 && typeof detalle === 'string') {
    return throwError(() => new Error(detalle));
  }
  return buildHttpError(error, clave);
}

/**
 * Pedidos del panel de administración. El backend responde 403 si la cuenta no es admin; el
 * mensaje de error del servidor se muestra tal cual porque explica qué dato no es válido.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) { }

  getResumen(): Observable<ResumenAdmin> {
    return this.http.get<ResumenAdmin>(`${this.base}/resumen`).pipe(
      catchError((error: HttpErrorResponse) => errorAdmin(error, 'admin.errores.cargar'))
    );
  }

  actualizarPais(id: string, cambios: CambiosPais): Observable<Pais> {
    return this.http.patch<Pais>(`${this.base}/paises/${encodeURIComponent(id)}`, cambios).pipe(
      catchError((error: HttpErrorResponse) => errorAdmin(error, 'admin.errores.guardar'))
    );
  }

  getComentarios(): Observable<ComentarioAdmin[]> {
    return this.http.get<ComentarioAdmin[]>(`${this.base}/comentarios`).pipe(
      catchError((error: HttpErrorResponse) => errorAdmin(error, 'admin.errores.cargar'))
    );
  }

  borrarComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comentarios/${encodeURIComponent(id)}`).pipe(
      catchError((error: HttpErrorResponse) => errorAdmin(error, 'admin.errores.borrar'))
    );
  }

  getRegistro(): Observable<AccionRegistro[]> {
    return this.http.get<AccionRegistro[]>(`${this.base}/registro`).pipe(
      catchError((error: HttpErrorResponse) => errorAdmin(error, 'admin.errores.cargar'))
    );
  }
}
