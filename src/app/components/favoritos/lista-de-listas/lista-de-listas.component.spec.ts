import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ListaDeListasComponent } from './lista-de-listas.component';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisesService } from '../../../core/service/paises.service';
import { proveerTraducciones } from '../../../core/i18n/traducciones.providers';

describe('ListaDeListasComponent - video decorativo', () => {
  let fixture: ComponentFixture<ListaDeListasComponent>;
  let router: Router;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    location = jasmine.createSpyObj<Location>('Location', ['back']);
    await TestBed.configureTestingModule({
      imports: [ListaDeListasComponent],
      providers: [proveerTraducciones(), provideRouter([]),
        { provide: Location, useValue: location },
        { provide: IdUsuarioService, useValue: { id$: of('usuario') } },
        { provide: UsuariosService, useValue: {
          obtenerListasFav: () => of([{ idLista: 'viaje', nombreLista: 'Viaje', listaCiudades: [] }])
        } },
        { provide: PaisesService, useValue: { getPaises: () => of([]) } }
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ListaDeListasComponent);
  });

  afterEach(() => fixture.destroy());

  function comprobarContenidoVisible(): void {
    const main: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(main).not.toBeNull();
    expect(getComputedStyle(main).opacity).toBe('1');
    expect(getComputedStyle(main).visibility).toBe('visible');
    expect(main.textContent).toContain('Mis listas favoritas');
    expect(main.querySelector('app-card')).not.toBeNull();
    expect(main.classList.contains('opacity-0')).toBeFalse();
  }

  it('muestra el contenido en el primer render sin esperar eventos del video', () => {
    fixture.detectChanges();
    comprobarContenidoVisible();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
  });

  it('mantiene las listas y los controles interactivos sin video local', () => {
    fixture.detectChanges();
    comprobarContenidoVisible();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    const card: HTMLElement = fixture.nativeElement.querySelector('app-card');
    card.click();
    expect(router.navigate).toHaveBeenCalledWith(['/listaCiudadesComp', 'viaje']);
    card.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(router.navigate).toHaveBeenCalledTimes(2);
    fixture.nativeElement.querySelector('main button').click();
    expect(location.back).toHaveBeenCalledTimes(1);
  });
});
