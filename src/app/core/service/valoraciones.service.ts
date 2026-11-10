import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Valoracion } from '../../models/interface/valoracion.interface';
import { buildHttpError } from '../utils/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class ValoracionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/valoraciones`;

  getValoraciones(ciudad: string, paisId: string): Observable<Valoracion[]> {
    return this.http.get<Valoracion[]>(this.apiUrl, { params: { ciudad, paisId } }).pipe(
      catchError(error => buildHttpError(error, 'mensajes.cargarValoraciones'))
    );
  }

  /** Crea la valoración del usuario o, si ya tenía una, cambia su puntaje. */
  valorar(ciudad: string, paisId: string, puntaje: number, existente?: Valoracion): Observable<Valoracion> {
    const pedido = existente?.id
      ? this.http.patch<Valoracion>(`${this.apiUrl}/${existente.id}`, { puntaje })
      : this.http.post<Valoracion>(this.apiUrl, { ciudad, paisId, puntaje });
    return pedido.pipe(
      catchError(error => buildHttpError(error, 'mensajes.guardarValoracion'))
    );
  }
}
