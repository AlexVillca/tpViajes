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
      current: { temperature_2m: 20, relative_humidity_2m: 50, weather_code: 0, wind_speed_10m: 10 }
    });

    expect(resultado).toEqual({
      ciudad: 'Córdoba',
      temperatura: 20,
      humedad: 50,
      viento: 10,
      descripcion: 'Despejado',
      emoji: '☀️'
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

    expect(error?.message).toContain('No se encontró');
  });
});
