import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Comentario } from '../../models/interface/pais.interface';
import { ConstantPool } from '@angular/compiler';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {

  constructor(private http: HttpClient) { }

  urlBaseComentarios = environment.urlBaseComentarios;


  getComentarios(): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.urlBaseComentarios}`);
  }

  postComentario(comentario : Comentario): Observable<Comentario>{
    return this.http.post<Comentario>(`${this.urlBaseComentarios}`, comentario);
  }
}
