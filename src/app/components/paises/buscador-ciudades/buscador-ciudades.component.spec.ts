import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BuscadorCiudadesComponent, normalizarBusqueda } from './buscador-ciudades.component';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Pais } from '../../../models/interface/pais.interface';

describe('BuscadorCiudadesComponent', () => {
  const paises: Pais[] = [
    { id: 'ar', nombre: 'Argentina', visible: true, ciudades: [{ nombre: 'Córdoba' }, { nombre: 'Buenos Aires' }] },
    { id: 'es', nombre: 'España', visible: true, ciudades: [{ nombre: 'Cordoba' }, { nombre: 'Madrid' }] },
    { id: 'eg', nombre: 'Egipto', en: { nombre: 'Egypt' }, visible: true, ciudades: [{ nombre: 'El Cairo', en: { nombre: 'Cairo' } }] }
  ];
  let router: jasmine.SpyObj<Router>;
  let paisData: jasmine.SpyObj<PaisDataService>;
  let ciudadData: jasmine.SpyObj<CiudadDataService>;

  function crear() {
    const fixture = TestBed.createComponent(BuscadorCiudadesComponent);
    fixture.componentInstance.paises = paises;
    fixture.detectChanges();
    return fixture;
  }

  function escribir(fixture: ReturnType<typeof crear>, texto: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  }

  const tecla = (input: HTMLInputElement, key: string) => input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    paisData = jasmine.createSpyObj<PaisDataService>('PaisDataService', ['setPais']);
    ciudadData = jasmine.createSpyObj<CiudadDataService>('CiudadDataService', ['setCiudad']);
    TestBed.configureTestingModule({
      imports: [BuscadorCiudadesComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: PaisDataService, useValue: paisData },
        { provide: CiudadDataService, useValue: ciudadData }
      ]
    });
  });

  it('normaliza acentos y mayúsculas', () => {
    expect(normalizarBusqueda('  CÓRDOBA ')).toBe('cordoba');
  });

  it('encuentra ciudades sin importar los acentos y muestra el país de cada una', () => {
    const fixture = crear();
    escribir(fixture, 'cordo');
    const opciones = fixture.nativeElement.querySelectorAll('[role="option"]');

    expect(opciones.length).toBe(2);
    expect(opciones[0].textContent).toContain('Argentina');
    expect(opciones[1].textContent).toContain('España');
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-expanded')).toBe('true');
  });

  it('también busca por el nombre en inglés', () => {
    const fixture = crear();
    escribir(fixture, 'cairo');
    expect(fixture.nativeElement.querySelector('[role="option"]').textContent).toContain('El Cairo');
  });

  it('con las flechas cambia la opción activa y con Enter abre la ciudad', () => {
    const fixture = crear();
    const input = escribir(fixture, 'cordo');
    tecla(input, 'ArrowDown');
    fixture.detectChanges();

    expect(input.getAttribute('aria-activedescendant')).toBe('buscador-opcion-es-0');
    tecla(input, 'Enter');

    expect(paisData.setPais).toHaveBeenCalledWith(paises[1]);
    expect(ciudadData.setCiudad).toHaveBeenCalledWith({ nombre: 'Cordoba' });
    expect(router.navigate).toHaveBeenCalledWith(['/ciudad']);
  });

  it('Escape cierra la lista y avisa cuando no hay resultados', () => {
    const fixture = crear();
    const input = escribir(fixture, 'zzz');
    expect(fixture.nativeElement.textContent).toContain('No encontramos ciudades');

    tecla(input, 'Escape');
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
