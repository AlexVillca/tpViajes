import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PaisDetailComponent } from './pais-detail.component';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';

describe('PaisDetailComponent - regreso', () => {
  it('regresa siempre al listado de países', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: router },
      { provide: PaisDataService, useValue: { pais$: of(null) } },
      { provide: CiudadDataService, useValue: {} }
    ] });
    const component = TestBed.runInInjectionContext(() => new PaisDetailComponent());
    component.volver();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/paises']);
  });
});