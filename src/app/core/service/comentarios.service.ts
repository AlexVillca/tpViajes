import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Comentario } from '../../models/interface/pais.interface';
import { catchError, Observable } from 'rxjs';
import { buildHttpError } from '../utils/http-error.util';

/** Acceso a la API de comentarios: listar, crear, editar y borrar comentarios de una ciudad. */
@Injectable({
  providedIn: 'root'
})
export class ComentariosService {

  constructor(private http: HttpClient) { }

  private apiUrl = `${environment.apiBaseUrl}/comentarios`;

  /** Comentarios de una ciudad de un país (puede haber ciudades con el mismo nombre en países distintos). */
  getComentarios(paisId: string, ciudad: string): Observable<Comentario[]> {
    const params = new HttpParams().set('paisId', paisId).set('ciudad', ciudad);
    return this.http.get<Comentario[]>(this.apiUrl, { params }).pipe(
      catchError(error => buildHttpError(error, 'mensajes.cargarComentarios'))
    );
  }

  postComentario(comentario : Comentario): Observable<Comentario>{
    return this.http.post<Comentario>(this.apiUrl, comentario).pipe(
      catchError(error => buildHttpError(error, 'mensajes.publicarComentario'))
    );
  }

  updateComentario(id: string, comentario: Partial<Comentario>): Observable<Comentario> {
    return this.http.patch<Comentario>(`${this.apiUrl}/${id}`, comentario).pipe(
      catchError(error => buildHttpError(error, 'mensajes.editarComentario'))
    );
  }

  deleteComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => buildHttpError(error, 'mensajes.eliminarComentario'))
    );
  }
}
