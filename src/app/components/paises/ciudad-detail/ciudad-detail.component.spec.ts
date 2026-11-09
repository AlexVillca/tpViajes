import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CiudadDetailComponent } from './ciudad-detail.component';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';

describe('CiudadDetailComponent - regreso contextual', () => {
  let pais: BehaviorSubject<Pais | null>;
  let ciudad: BehaviorSubject<Ciudad | null>;
  let router: jasmine.SpyObj<Router>;
  let component: CiudadDetailComponent;

  beforeEach(() => {
    pais = new BehaviorSubject<Pais | null>(null);
    ciudad = new BehaviorSubject<Ciudad | null>(null);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const ciudades = { ciudad$: ciudad } as unknown as CiudadDataService;
    TestBed.configureTestingModule({ providers: [
      { provide: PaisDataService, useValue: { pais$: pais } },
      { provide: CiudadDataService, useValue: ciudades },
      { provide: IdUsuarioService, useValue: { id$: of(null) } }
    ] });
    component = TestBed.runInInjectionContext(() => new CiudadDetailComponent(ciudades, router));
  });

  it('regresa al país correspondiente sin cambiar la selección', () => {
    const seleccion = { nombre: 'Buenos Aires' };
    const argentina: Pais = { id: 'ar', nombre: 'Argentina', visible: true, ciudades: [seleccion] };
    pais.next(argentina);
    ciudad.next(seleccion);
    component.volver();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/pais']);
    expect(pais.value).toBe(argentina);
    expect(ciudad.value).toBe(seleccion);
    pais.next(null);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('usa Países cuando falta selección o el país no corresponde', () => {
    component.volver();
    ciudad.next({ nombre: 'Madrid' });
    component.volver();
    pais.next({ id: 'ar', nombre: 'Argentina', visible: true, ciudades: [{ nombre: 'Buenos Aires' }] });
    component.volver();
    ciudad.next(null);
    component.volver();
    expect(router.navigate.calls.allArgs()).toEqual([
      ['/paises'], ['/paises'], ['/paises'], ['/paises']
    ].map(destino => [destino]));
  });
});