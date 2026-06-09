import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

// Respuesta cruda de REST Countries para un pais (endpoint /alpha/{code}).
interface RespuestaPais {
  flags?: { png?: string; svg?: string; alt?: string };
  capital?: string[];
  population?: number;
  region?: string;
  subregion?: string;
  area?: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  timezones?: string[];
  borders?: string[];
}

// Respuesta cruda para los paises limitrofes.
interface RespuestaLimitrofe {
  cca3: string;
  name: { common: string };
  translations?: { spa?: { common: string } };
}

// Modelo propio, ya normalizado y en español, listo para la vista.
export interface PaisInfo {
  banderaUrl: string;
  banderaAlt: string;
  capital: string;
  poblacion: number;
  region: string;
  subregion: string;
  area: number;
  idiomas: string[];
  monedas: string[];
  zonasHorarias: string[];
  limitrofes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RestCountriesService {
  private apiUrl = environment.restCountriesApiUrl;

  constructor(private http: HttpClient) { }

  // Trae datos confiables del pais a partir de su codigo ISO alpha-2 (ej: "AR").
  getInfoPais(codigo: string): Observable<PaisInfo> {
    const fields =
      'flags,capital,population,languages,currencies,timezones,borders,region,subregion,area';
    return this.http
      .get<RespuestaPais>(`${this.apiUrl}/alpha/${codigo}?fields=${fields}`)
      .pipe(
        switchMap(resp => this.agregarLimitrofes(resp)),
        catchError(error =>
          buildHttpError(error, 'No se pudo obtener la información del país.')
        )
      );
  }

  // Normaliza la respuesta y, si hay paises limitrofes, resuelve sus nombres.
  private agregarLimitrofes(resp: RespuestaPais): Observable<PaisInfo> {
    const base: PaisInfo = {
      banderaUrl: resp.flags?.png ?? '',
      banderaAlt: resp.flags?.alt ?? '',
      capital: resp.capital?.join(', ') || '—',
      poblacion: resp.population ?? 0,
      region: resp.region ?? '—',
      subregion: resp.subregion ?? '—',
      area: resp.area ?? 0,
      idiomas: resp.languages ? Object.values(resp.languages) : [],
      monedas: resp.currencies
        ? Object.values(resp.currencies).map(c => c.name)
        : [],
      zonasHorarias: resp.timezones ?? [],
      limitrofes: []
    };

    if (!resp.borders || resp.borders.length === 0) {
      return of(base);
    }

    const codes = resp.borders.join(',');
    return this.http
      .get<RespuestaLimitrofe[]>(
        `${this.apiUrl}/alpha?codes=${codes}&fields=cca3,name,translations`
      )
      .pipe(
        map(lista => ({
          ...base,
          limitrofes: lista.map(l => l.translations?.spa?.common ?? l.name.common)
        })),
        // Si fallan los limitrofes, mostramos igual el resto de los datos.
        catchError(() => of(base))
      );
  }
}
