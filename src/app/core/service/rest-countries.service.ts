import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

interface ApiErrorItem {
  message?: string;
}

interface ApiListResponse<T> {
  data?: {
    objects?: T[];
  } | null;
  errors?: ApiErrorItem[];
  success?: boolean;
}

interface RespuestaPaisV5 {
  flag?: {
    url_png?: string;
    description?: string;
  };
  capitals?: Array<{
    name?: string;
  }>;
  population?: number;
  region?: string;
  subregion?: string;
  area?: {
    kilometers?: number;
  };
  languages?: Array<{
    name?: string;
  }>;
  currencies?: Array<{
    name?: string;
  }>;
  timezones?: string[];
  borders?: string[];
}

interface RespuestaLimitrofeV5 {
  names?: {
    common?: string;
    translations?: {
      spa?: {
        common?: string;
      };
    };
  };
}

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
  private apiKey = environment.restCountriesApiKey;

  constructor(private http: HttpClient) { }

  getInfoPais(codigo: string): Observable<PaisInfo> {
    if (!this.apiKey) {
      return throwError(() => new Error(
        'Falta configurar la API key de REST Countries.'
      ));
    }

    const fields = [
      'flag.url_png',
      'flag.description',
      'capitals.name',
      'population',
      'region',
      'subregion',
      'area.kilometers',
      'languages.name',
      'currencies.name',
      'timezones',
      'borders'
    ].join(',');

    return this.http
      .get<ApiListResponse<RespuestaPaisV5>>(
        `${this.apiUrl}/codes.alpha_2/${codigo}?response_fields=${fields}`,
        { headers: this.buildHeaders() }
      )
      .pipe(
        map(resp => this.requireFirstObject(resp)),
        switchMap(resp => this.agregarLimitrofes(resp)),
        catchError(error => this.normalizeApiError(error, 'No se pudo obtener la información del país.'))
      );
  }

  private agregarLimitrofes(resp: RespuestaPaisV5): Observable<PaisInfo> {
    const base: PaisInfo = {
      banderaUrl: resp.flag?.url_png ?? '',
      banderaAlt: resp.flag?.description ?? '',
      capital: resp.capitals?.map(c => c.name).filter(Boolean).join(', ') || '—',
      poblacion: resp.population ?? 0,
      region: resp.region ?? '—',
      subregion: resp.subregion ?? '—',
      area: resp.area?.kilometers ?? 0,
      idiomas: resp.languages
        ? resp.languages
            .map(l => l.name)
            .filter((nombre): nombre is string => Boolean(nombre))
        : [],
      monedas: resp.currencies
        ? resp.currencies
            .map(m => m.name)
            .filter((nombre): nombre is string => Boolean(nombre))
        : [],
      zonasHorarias: resp.timezones ?? [],
      limitrofes: []
    };

    if (!resp.borders || resp.borders.length === 0) {
      return of(base);
    }

    const requests = resp.borders.map(code =>
      this.http
        .get<ApiListResponse<RespuestaLimitrofeV5>>(
          `${this.apiUrl}/codes.alpha_3/${code}?response_fields=names.common,names.translations.spa.common`,
          { headers: this.buildHeaders() }
        )
        .pipe(
          map(response => this.requireFirstObject(response)),
          map(limitrofe => limitrofe.names?.translations?.spa?.common ?? limitrofe.names?.common ?? code),
          catchError(() => of(code))
        )
    );

    return forkJoin(requests).pipe(
      map(limitrofes => ({
        ...base,
        limitrofes
      }))
    );
  }

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.apiKey}`
    });
  }

  private requireFirstObject<T>(resp: ApiListResponse<T>): T {
    if (resp.success === false) {
      const message = resp.errors?.[0]?.message ?? 'La API de REST Countries devolvió un error.';
      throw new Error(message);
    }

    const first = resp.data?.objects?.[0];

    if (!first) {
      throw new Error('No se encontró información para el país solicitado.');
    }

    return first;
  }

  private normalizeApiError(error: unknown, fallbackMessage: string) {
    if (error instanceof Error) {
      return throwError(() => error);
    }

    return buildHttpError(error as HttpErrorResponse, fallbackMessage);
  }
}
