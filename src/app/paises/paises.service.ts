import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pais } from './pais'; // Importa la interfaz Pais

@Injectable({
  providedIn: 'root' // o 'PaisesModule' si quieres que el servicio solo sea accesible en este módulo
})
export class PaisesService {
  private apiUrl = 'http://localhost:3000/paises';

  constructor(private http: HttpClient) { }

  getPaises(): Observable<Pais[]> {
    return this.http.get<Pais[]>(this.apiUrl);
  }

  getPais(codigo: string): Observable<Pais> {
    const url = `${this.apiUrl}/${codigo}`;
    return this.http.get<Pais>(url);
  }
}
