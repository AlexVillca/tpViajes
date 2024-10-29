import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Pais } from '../../models/interface/pais.interface';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = 'http://localhost:3000/paises';

  constructor(private http: HttpClient) { }

  getPaises(): Observable<Pais[]> {
    return this.http.get<Pais[]>(this.apiUrl);
  }

  getPais(codigo: string): Observable<Pais> {
    const codigoLimpio = codigo.replace(/\u200B/g, '');
    const url = `${this.apiUrl}/${codigoLimpio}`;
    return this.http.get<Pais>(url).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.error('Error 404:', url, error); // Muestra la URL que falló
        } else {
          console.error('Error en la petición:', error);
        }
        return throwError(() => new Error('No se pudo obtener el país'));
      })
    );
  }
}
