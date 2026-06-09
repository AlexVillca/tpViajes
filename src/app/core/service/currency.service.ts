import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

// Respuesta cruda de la API open.er-api.com
interface RespuestaTasas {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

// Modelo propio, desacoplado del formato de la API externa.
export interface TasasCambio {
  base: string;
  ultimaActualizacion: string;
  rates: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = environment.currencyApiUrl;

  constructor(private http: HttpClient) { }

  // Trae todas las cotizaciones tomando "base" como moneda de referencia.
  getTasas(base: string): Observable<TasasCambio> {
    return this.http.get<RespuestaTasas>(`${this.apiUrl}/${base}`).pipe(
      map(resp => ({
        base: resp.base_code,
        ultimaActualizacion: resp.time_last_update_utc,
        rates: resp.rates
      })),
      catchError(error =>
        buildHttpError(error, 'No se pudieron obtener las cotizaciones.')
      )
    );
  }

  // Extrae el codigo ISO (ej: "Peso argentino (ARS)" -> "ARS").
  // Si la moneda lista varias, devuelve la primera.
  extraerCodigoIso(moneda?: string): string | null {
    if (!moneda) {
      return null;
    }
    const match = moneda.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : null;
  }
}
