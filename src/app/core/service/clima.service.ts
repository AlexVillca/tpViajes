import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
}
interface GeoResponse {
  results?: GeoResult[];
}
interface ForecastResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

/** Un día del pronóstico: fecha ISO (YYYY-MM-DD), máxima y mínima, e ícono/clave del estado. */
export interface DiaPronostico {
  fecha: string;
  tempMax: number;
  tempMin: number;
  claveDescripcion: string;
  emoji: string;
}

export interface ClimaActual {
  ciudad: string;
  temperatura: number;
  humedad: number;
  viento: number;
  /** Clave del texto traducible: clima.codigos.<clave> (c0, c3, ..., sinDatos). */
  claveDescripcion: string;
  emoji: string;
  /** Pronóstico de los próximos días (sin incluir el día de hoy). */
  pronostico: DiaPronostico[];
}

@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  private geoUrl = environment.geocodingApiUrl;
  private forecastUrl = environment.weatherApiUrl;

  constructor(private http: HttpClient) { }

  getClima(ciudad: string, codigoPais?: string | null): Observable<ClimaActual> {
    const url = `${this.geoUrl}?name=${encodeURIComponent(ciudad)}&count=10&language=es&format=json`;

    return this.http.get<GeoResponse>(url).pipe(
      map(resp => this.elegirUbicacion(resp, codigoPais)),
      switchMap(ubicacion => this.consultarClima(ubicacion)),
      catchError(error => {
        if (error instanceof Error) {
          return throwError(() => error);
        }
        return buildHttpError(error, 'mensajes.obtenerClima');
      })
    );
  }

  private elegirUbicacion(resp: GeoResponse, codigoPais?: string | null): GeoResult {
    const resultados = resp.results ?? [];

    if (resultados.length === 0) {
      throw new Error('mensajes.ubicacionNoEncontrada');
    }

    if (codigoPais) {
      const match = resultados.find(
        r => r.country_code?.toUpperCase() === codigoPais.toUpperCase()
      );
      if (match) {
        return match;
      }
    }

    return resultados[0];
  }

  private consultarClima(ubicacion: GeoResult): Observable<ClimaActual> {
    const url =
      `${this.forecastUrl}?latitude=${ubicacion.latitude}&longitude=${ubicacion.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;

    return this.http.get<ForecastResponse>(url).pipe(
      map(resp => {
        const actual = resp.current;
        if (!actual) {
          throw new Error('mensajes.climaSinDatos');
        }

        const { emoji, clave } = this.interpretarCodigo(actual.weather_code);

        return {
          ciudad: ubicacion.name,
          temperatura: actual.temperature_2m,
          humedad: actual.relative_humidity_2m,
          viento: actual.wind_speed_10m,
          claveDescripcion: clave,
          emoji,
          pronostico: this.armarPronostico(resp.daily)
        };
      })
    );
  }

  /** Toma los próximos 3 días (sin hoy) del bloque "daily" de open-meteo. */
  private armarPronostico(daily?: ForecastResponse['daily']): DiaPronostico[] {
    if (!daily?.time?.length) return [];
    const dias: DiaPronostico[] = [];
    for (let i = 1; i < daily.time.length && dias.length < 3; i++) {
      const { emoji, clave } = this.interpretarCodigo(daily.weather_code[i]);
      dias.push({
        fecha: daily.time[i],
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        claveDescripcion: clave,
        emoji
      });
    }
    return dias;
  }

  private interpretarCodigo(code: number): { emoji: string; clave: string } {
    // El texto se resuelve por i18n con la clave (clima.codigos.<clave>); acá solo el emoji.
    const emojis: Record<number, string> = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌧️', 57: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
      71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
      80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };

    const emoji = emojis[code];
    return emoji ? { emoji, clave: `c${code}` } : { emoji: '🌡️', clave: 'sinDatos' };
  }
}
