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
}

export interface ClimaActual {
  ciudad: string;
  temperatura: number;
  humedad: number;
  viento: number;
  descripcion: string;
  emoji: string;
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
        return buildHttpError(error, 'No se pudo obtener el clima.');
      })
    );
  }

  private elegirUbicacion(resp: GeoResponse, codigoPais?: string | null): GeoResult {
    const resultados = resp.results ?? [];

    if (resultados.length === 0) {
      throw new Error('No se encontró la ubicación de la ciudad.');
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
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

    return this.http.get<ForecastResponse>(url).pipe(
      map(resp => {
        const actual = resp.current;
        if (!actual) {
          throw new Error('El servicio de clima no devolvió datos.');
        }

        const { descripcion, emoji } = this.interpretarCodigo(actual.weather_code);

        return {
          ciudad: ubicacion.name,
          temperatura: actual.temperature_2m,
          humedad: actual.relative_humidity_2m,
          viento: actual.wind_speed_10m,
          descripcion,
          emoji
        };
      })
    );
  }

  private interpretarCodigo(code: number): { descripcion: string; emoji: string } {
    const mapa: Record<number, { descripcion: string; emoji: string }> = {
      0: { descripcion: 'Despejado', emoji: '☀️' },
      1: { descripcion: 'Mayormente despejado', emoji: '🌤️' },
      2: { descripcion: 'Parcialmente nublado', emoji: '⛅' },
      3: { descripcion: 'Nublado', emoji: '☁️' },
      45: { descripcion: 'Niebla', emoji: '🌫️' },
      48: { descripcion: 'Niebla con escarcha', emoji: '🌫️' },
      51: { descripcion: 'Llovizna ligera', emoji: '🌦️' },
      53: { descripcion: 'Llovizna', emoji: '🌦️' },
      55: { descripcion: 'Llovizna intensa', emoji: '🌦️' },
      56: { descripcion: 'Llovizna helada', emoji: '🌧️' },
      57: { descripcion: 'Llovizna helada intensa', emoji: '🌧️' },
      61: { descripcion: 'Lluvia ligera', emoji: '🌧️' },
      63: { descripcion: 'Lluvia', emoji: '🌧️' },
      65: { descripcion: 'Lluvia intensa', emoji: '🌧️' },
      66: { descripcion: 'Lluvia helada', emoji: '🌧️' },
      67: { descripcion: 'Lluvia helada intensa', emoji: '🌧️' },
      71: { descripcion: 'Nieve ligera', emoji: '🌨️' },
      73: { descripcion: 'Nieve', emoji: '🌨️' },
      75: { descripcion: 'Nieve intensa', emoji: '❄️' },
      77: { descripcion: 'Granos de nieve', emoji: '🌨️' },
      80: { descripcion: 'Chubascos ligeros', emoji: '🌦️' },
      81: { descripcion: 'Chubascos', emoji: '🌧️' },
      82: { descripcion: 'Chubascos violentos', emoji: '⛈️' },
      85: { descripcion: 'Chubascos de nieve', emoji: '🌨️' },
      86: { descripcion: 'Chubascos de nieve intensos', emoji: '❄️' },
      95: { descripcion: 'Tormenta', emoji: '⛈️' },
      96: { descripcion: 'Tormenta con granizo', emoji: '⛈️' },
      99: { descripcion: 'Tormenta con granizo fuerte', emoji: '⛈️' }
    };

    return mapa[code] ?? { descripcion: 'Sin datos', emoji: '🌡️' };
  }
}
