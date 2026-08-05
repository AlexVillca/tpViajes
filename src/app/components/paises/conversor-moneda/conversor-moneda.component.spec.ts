import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConversorMonedaComponent } from './conversor-moneda.component';
import { environment } from '../../../../environments/environment';

describe('ConversorMonedaComponent', () => {
  let fixture: ComponentFixture<ConversorMonedaComponent>;
  let component: ConversorMonedaComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConversorMonedaComponent, HttpClientTestingModule]
    });
    fixture = TestBed.createComponent(ConversorMonedaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sin moneda no consulta la API y deja monedaDestino en null', () => {
    component.monedaPais = undefined;
    fixture.detectChanges(); // dispara ngOnInit

    expect(component.monedaDestino).toBeNull();
  });

  it('con una moneda valida extrae el ISO y consulta las tasas', () => {
    component.monedaPais = 'Peso argentino (ARS)';
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.currencyApiUrl}/ARS`);
    req.flush({ result: 'success', base_code: 'ARS', time_last_update_utc: 'hoy', rates: { ARS: 1 } });

    expect(component.monedaDestino).toBe('ARS');
    expect(component.tasa).toBe(1);
  });
});
