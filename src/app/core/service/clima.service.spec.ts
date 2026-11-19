import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClimaService, ClimaActual } from './clima.service';
import { environment } from '../../../environments/environment';

describe('ClimaService', () => {
  let service: ClimaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ClimaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('geocodifica, prioriza el pais y mapea el clima', () => {
    let resultado: ClimaActual | undefined;

    service.getClima('Cordoba', 'AR').subscribe(r => (resultado = r));

    const geoReq = httpMock.expectOne(r => r.url.startsWith(environment.geocodingApiUrl));
    geoReq.flush({
      results: [
        { name: 'Córdoba', latitude: 37.9, longitude: -4.8, country_code: 'ES' },
        { name: 'Córdoba', latitude: -31.4, longitude: -64.2, country_code: 'AR' }
      ]
    });

    const fcReq = httpMock.expectOne(r => r.url.startsWith(environment.weatherApiUrl));
    expect(fcReq.request.url).toContain('latitude=-31.4');
    fcReq.flush({
      current: { temperature_2m: 20, relative_humidity_2m: 50, weather_code: 0, wind_speed_10m: 10 },
      daily: {
        time: ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"],
        weather_code: [0, 3, 61, 95],
        temperature_2m_max: [25, 22, 18, 20],
        temperature_2m_min: [12, 11, 9, 10]
      }
    });

    expect(resultado).toEqual({
      ciudad: 'Córdoba',
      temperatura: 20,
      humedad: 50,
      viento: 10,
      claveDescripcion: 'c0',
      emoji: '☀️',
      // El pronóstico saltea el día de hoy y toma los 3 siguientes.
      pronostico: [
        { fecha: '2026-11-19', tempMax: 22, tempMin: 11, claveDescripcion: 'c3', emoji: '☁️' },
        { fecha: '2026-11-20', tempMax: 18, tempMin: 9, claveDescripcion: 'c61', emoji: '🌧️' },
        { fecha: '2026-11-21', tempMax: 20, tempMin: 10, claveDescripcion: 'c95', emoji: '⛈️' }
      ]
    });
  });

  it('emite error cuando el geocoder no encuentra la ciudad', () => {
    let error: Error | undefined;

    service.getClima('CiudadInexistente').subscribe({
      next: () => fail('no debería emitir un valor'),
      error: (e) => (error = e)
    });

    httpMock
      .expectOne(r => r.url.startsWith(environment.geocodingApiUrl))
      .flush({ results: [] });

    expect(error?.message).toBe('mensajes.ubicacionNoEncontrada');
  });
});
