import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { PopUpGuardarFavoritosComponent } from './pop-up-guardar-favoritos.component';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { FeedbackService } from '../../../core/service/feedback.service';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { proveerTraducciones } from '../../../core/i18n/traducciones.providers';

describe('PopUpGuardarFavoritosComponent', () => {
  let fixture: ComponentFixture<PopUpGuardarFavoritosComponent>;
  let componente: PopUpGuardarFavoritosComponent;
  let usuarios: jasmine.SpyObj<UsuariosService>;
  let feedback: jasmine.SpyObj<FeedbackService>;
  let listasGuardadas: ListaFav[];

  beforeEach(async () => {
    // Fez ya está en "Guardadas"; "Mis favoritos" está vacía.
    listasGuardadas = [
      { idLista: 'g1', nombreLista: 'Guardadas', listaCiudades: [{ codigoPais: 'MA', nombre: 'Fez' }] },
      { idLista: 'm1', nombreLista: 'Mis favoritos', listaCiudades: [] }
    ];
    usuarios = jasmine.createSpyObj<UsuariosService>('UsuariosService', ['obtenerListasFav', 'actualizarListasFavoritos']);
    usuarios.obtenerListasFav.and.callFake(() => of(structuredClone(listasGuardadas)));
    usuarios.actualizarListasFavoritos.and.callFake((_id: string, listas: ListaFav[]) => of(listas));
    feedback = jasmine.createSpyObj<FeedbackService>('FeedbackService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [PopUpGuardarFavoritosComponent],
      providers: [
        proveerTraducciones(),
        { provide: UsuariosService, useValue: usuarios },
        { provide: FeedbackService, useValue: feedback },
        { provide: IdUsuarioService, useValue: { id$: new BehaviorSubject<string | null>('u1') } },
        { provide: PaisDataService, useValue: { pais$: new BehaviorSubject({ nombre: 'Marruecos', codigo: 'MA' }) } },
        { provide: CiudadDataService, useValue: { ciudad$: new BehaviorSubject({ nombre: 'Fez' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PopUpGuardarFavoritosComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.style.overflow = '';
  });

  function abrir(): void {
    componente.abrePopUp();
    fixture.detectChanges();
  }

  it('al abrir pide las listas y marca y bloquea las que ya tienen la ciudad', () => {
    abrir();

    expect(usuarios.obtenerListasFav).toHaveBeenCalledWith('u1');
    const guardadas = componente.groupCheckbox.get('g1')!;
    const misFavoritos = componente.groupCheckbox.get('m1')!;
    expect(guardadas.value).toBeTrue();
    expect(guardadas.disabled).toBeTrue();
    expect(misFavoritos.value).toBeFalse();
    expect(misFavoritos.enabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Ya guardada');
  });

  it('sin elegir ninguna lista no guarda nada y muestra un error', () => {
    abrir();

    componente.saveSelection();

    expect(usuarios.actualizarListasFavoritos).not.toHaveBeenCalled();
    expect(feedback.error).toHaveBeenCalledWith('mensajes.elegiUnaLista');
    expect(feedback.success).not.toHaveBeenCalled();
    expect(componente.visible).toBeTrue();
  });

  it('agregar la ciudad a otra lista no la quita de las que ya la tenían', () => {
    abrir();
    componente.groupCheckbox.get('m1')!.setValue(true);

    componente.saveSelection();

    const enviadas = usuarios.actualizarListasFavoritos.calls.mostRecent().args[1];
    expect(enviadas.find(l => l.idLista === 'g1')!.listaCiudades).toEqual([{ codigoPais: 'MA', nombre: 'Fez' }]);
    expect(enviadas.find(l => l.idLista === 'm1')!.listaCiudades).toEqual([{ codigoPais: 'MA', nombre: 'Fez' }]);
    expect(feedback.success).toHaveBeenCalledWith('mensajes.ciudadGuardada');
    expect(componente.visible).toBeFalse();
  });

  it('una lista nueva se crea con la ciudad adentro', () => {
    abrir();
    componente.nuevaListaInput.setValue('Verano');
    componente.agregarNuevaLista();

    componente.saveSelection();

    const enviadas = usuarios.actualizarListasFavoritos.calls.mostRecent().args[1];
    expect(enviadas.length).toBe(3);
    const nueva = enviadas.find(l => l.nombreLista === 'Verano')!;
    expect(nueva.listaCiudades).toEqual([{ codigoPais: 'MA', nombre: 'Fez' }]);
    expect(enviadas.find(l => l.idLista === 'g1')!.listaCiudades.length).toBe(1);
  });
});
