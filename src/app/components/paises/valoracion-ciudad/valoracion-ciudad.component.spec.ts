import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { ValoracionCiudadComponent } from './valoracion-ciudad.component';
import { ValoracionesService } from '../../../core/service/valoraciones.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { Valoracion } from '../../../models/interface/valoracion.interface';

describe('ValoracionCiudadComponent', () => {
  let sesion: BehaviorSubject<string | null>;
  let servicio: jasmine.SpyObj<ValoracionesService>;
  const existentes: Valoracion[] = [
    { id: '1', ciudad: 'Fez', paisId: 'ma', usuarioId: '5', puntaje: 5 },
    { id: '2', ciudad: 'Fez', paisId: 'ma', usuarioId: '6', puntaje: 4 },
    { id: '3', ciudad: 'Fez', paisId: 'ma', usuarioId: '7', puntaje: 4 }
  ];

  function crear() {
    const fixture = TestBed.createComponent(ValoracionCiudadComponent);
    fixture.componentInstance.ciudad = 'Fez';
    fixture.componentInstance.paisId = 'ma';
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    sesion = new BehaviorSubject<string | null>(null);
    servicio = jasmine.createSpyObj<ValoracionesService>('ValoracionesService', ['getValoraciones', 'valorar']);
    servicio.getValoraciones.and.returnValue(of(existentes));
    TestBed.configureTestingModule({
      imports: [ValoracionCiudadComponent],
      providers: [
        provideRouter([]),
        { provide: ValoracionesService, useValue: servicio },
        { provide: IdUsuarioService, useValue: { id$: sesion } }
      ]
    });
  });

  it('muestra el promedio con coma decimal y la cantidad de valoraciones', () => {
    const fixture = crear();
    expect(servicio.getValoraciones).toHaveBeenCalledWith('Fez', 'ma');
    expect(fixture.nativeElement.textContent).toContain('4,3');
    expect(fixture.nativeElement.textContent).toContain('3 valoraciones');
  });

  it('sin sesión invita a iniciar sesión y no muestra el selector', () => {
    const fixture = crear();
    expect(fixture.nativeElement.querySelector('input[type="radio"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).not.toBeNull();
  });

  it('con sesión crea la valoración y actualiza el promedio', () => {
    sesion.next('9');
    servicio.valorar.and.returnValue(of({ id: '4', ciudad: 'Fez', paisId: 'ma', usuarioId: '9', puntaje: 3 }));
    const fixture = crear();

    const tercera: HTMLInputElement = fixture.nativeElement.querySelector('input[value="3"]');
    tercera.click();
    fixture.detectChanges();

    expect(servicio.valorar).toHaveBeenCalledWith('Fez', 'ma', 3, undefined);
    expect(fixture.nativeElement.textContent).toContain('4 valoraciones');
    expect(fixture.nativeElement.textContent).toContain('Tu valoración');
  });

  it('si el usuario ya había valorado, cambia esa misma valoración', () => {
    sesion.next('6');
    servicio.valorar.and.returnValue(of({ ...existentes[1], puntaje: 2 }));
    const fixture = crear();

    fixture.nativeElement.querySelector('input[value="2"]').click();

    expect(servicio.valorar).toHaveBeenCalledWith('Fez', 'ma', 2, existentes[1]);
    expect(fixture.componentInstance.cantidad).toBe(3);
  });
});
