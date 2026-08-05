import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CurrencyService, TasasCambio } from './currency.service';
import { environment } from '../../../environments/environment';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CurrencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('extraerCodigoIso', () => {
    it('extrae el ISO de una moneda simple', () => {
      expect(service.extraerCodigoIso('Peso argentino (ARS)')).toBe('ARS');
    });

    it('toma el primer ISO cuando hay varias monedas', () => {
      expect(service.extraerCodigoIso('Balboa (PAB), Dólar (USD)')).toBe('PAB');
    });

    it('devuelve null cuando no hay codigo entre parentesis', () => {
      expect(service.extraerCodigoIso('sin codigo')).toBeNull();
    });

    it('devuelve null con undefined', () => {
      expect(service.extraerCodigoIso(undefined)).toBeNull();
    });
  });

  describe('getTasas', () => {
    it('mapea la respuesta de la API al modelo TasasCambio', () => {
      const mock = {
        result: 'success',
        base_code: 'ARS',
        time_last_update_utc: 'hoy',
        rates: { USD: 0.001, EUR: 0.0009 }
      };
      let resultado: TasasCambio | undefined;

      service.getTasas('ARS').subscribe(r => (resultado = r));

      const req = httpMock.expectOne(`${environment.currencyApiUrl}/ARS`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);

      expect(resultado).toEqual({
        base: 'ARS',
        ultimaActualizacion: 'hoy',
        rates: { USD: 0.001, EUR: 0.0009 }
      });
    });
  });
});
