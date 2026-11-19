import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { PaisDetailComponent } from './pais-detail.component';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { PaisesService } from '../../../core/service/paises.service';

describe('PaisDetailComponent - regreso', () => {
  it('regresa siempre al listado de países', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: router },
      { provide: PaisDataService, useValue: { pais$: of(null) } },
      { provide: CiudadDataService, useValue: {} },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      { provide: PaisesService, useValue: { getPaisPorId: () => of(undefined) } }
    ] });
    const component = TestBed.runInInjectionContext(() => new PaisDetailComponent());
    component.volver();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/paises']);
  });
});