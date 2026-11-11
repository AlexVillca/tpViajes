import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { Pais } from '../../models/interface/pais.interface';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = `${environment.apiBaseUrl}/paises`;

  constructor(private http: HttpClient) { }

  getPaises(): Observable<Pais[]> {
    return this.http.get<Pais[]>(this.apiUrl).pipe(
      catchError(error => buildHttpError(error, 'mensajes.cargarPaises'))
    );
  }

  /** Un país por su id. Sirve para rearmar la página al recargar o abrir un link compartido. */
  getPaisPorId(id: string): Observable<Pais | undefined> {
    return this.getPaises().pipe(map(paises => paises.find(p => p.id === id)));
  }
}
