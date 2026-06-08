import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Comentario } from '../../models/interface/pais.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {

  constructor(private http: HttpClient) { }

  // Comentarios usa la misma base y su propio endpoint.
  private apiUrl = `${environment.apiBaseUrl}/comentarios`;


  getComentarios(): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(this.apiUrl);
  }

  postComentario(comentario : Comentario): Observable<Comentario>{
    return this.http.post<Comentario>(this.apiUrl, comentario);
  }
}
