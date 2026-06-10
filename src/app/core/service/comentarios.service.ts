import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Comentario } from '../../models/interface/pais.interface';
import { catchError, Observable } from 'rxjs';
import { buildHttpError } from '../utils/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {

  constructor(private http: HttpClient) { }

  // Comentarios usa la misma base y su propio endpoint.
  private apiUrl = `${environment.apiBaseUrl}/comentarios`;


  getComentarios(): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(this.apiUrl).pipe(
      catchError(error => buildHttpError(error, 'No se pudieron cargar los comentarios.'))
    );
  }

  postComentario(comentario : Comentario): Observable<Comentario>{
    return this.http.post<Comentario>(this.apiUrl, comentario).pipe(
      catchError(error => buildHttpError(error, 'No se pudo publicar el comentario.'))
    );
  }

  updateComentario(id: string, comentario: Partial<Comentario>): Observable<Comentario> {
    // PATCH alcanza porque solo vamos a editar parte del comentario.
    return this.http.patch<Comentario>(`${this.apiUrl}/${id}`, comentario).pipe(
      catchError(error => buildHttpError(error, 'No se pudo editar el comentario.'))
    );
  }

  deleteComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => buildHttpError(error, 'No se pudo eliminar el comentario.'))
    );
  }
}
