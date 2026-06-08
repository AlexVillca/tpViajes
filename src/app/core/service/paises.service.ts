import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pais } from '../../models/interface/pais.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  // Todos los servicios comparten la misma base y cambian solo el recurso.
  private apiUrl = `${environment.apiBaseUrl}/paises`;

  constructor(private http: HttpClient) { }

  getPaises(): Observable<Pais[]> {
    return this.http.get<Pais[]>(this.apiUrl);
  }
}
