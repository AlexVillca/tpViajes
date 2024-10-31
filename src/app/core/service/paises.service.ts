import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Pais } from '../../models/interface/pais.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = environment.urlBasePaises;

  constructor(private http: HttpClient) { }

  getPaises(): Observable<Pais[]> {
    return this.http.get<Pais[]>(this.apiUrl);
  }

  getPais(codigo: string): Observable<Pais> {
    const url = `${this.apiUrl}`;
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
