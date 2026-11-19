import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { valorExistenteMap } from '../../../validators/valorExistenteMap.validator';
import { maxItemsValidator } from '../../../validators/maxItems.validator';
import { FeedbackService } from '../../../core/service/feedback.service';
import { DialogoDirective } from '../../utils/dialogo/dialogo.directive';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Ventana para guardar la ciudad actual en una o varias listas de favoritos, o crear una lista nueva.
 * Solo agrega: las listas que ya tienen la ciudad aparecen marcadas y bloqueadas, y para quitarla
 * de una lista se usa la página de favoritos. Las listas se piden al backend cada vez que se abre,
 * así lo que se muestra coincide siempre con lo guardado.
 */
@Component({
  selector: 'app-pop-up-guardar-favoritos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogoDirective, TranslatePipe],
  templateUrl: './pop-up-guardar-favoritos.component.html'
})
export class PopUpGuardarFavoritosComponent {

  private readonly fb = inject(FormBuilder);
  private readonly us = inject(UsuariosService);
  private readonly ids = inject(IdUsuarioService);
  private readonly paisDataService = inject(PaisDataService);
  private readonly ciudadDataService = inject(CiudadDataService);
  private readonly feedback = inject(FeedbackService);

  visible = false;
  logueado = false;
  cargando = false;
  guardando = false;

  private idUsuario: string | null = null;
  private paisSeleccionado: Pais | null = null;
  private ciudadSeleccionada: Ciudad | null = null;

  private listasFavoritosDB: ListaFav[] = [];
  mapNombresListas = new Map<string, string>();
  /** Ids de las listas que ya tienen la ciudad (se muestran marcadas y no se pueden destildar). */
  listasConLaCiudad = new Set<string>();

  formulario: FormGroup = this.fb.group({
    nuevocheckboxListaFavorito: ['', [Validators.required, valorExistenteMap(this.mapNombresListas), maxItemsValidator(this.mapNombresListas, 6)]],
    checkboxesListasFavoritos: this.fb.group({})
  });

  get groupCheckbox(): FormGroup {
    return this.formulario.get('checkboxesListasFavoritos') as FormGroup;
  }

  // Se leen los controles (no el value) porque los controles deshabilitados no aparecen en value.
  get idsGroupCheckbox(): string[] {
    return Object.keys(this.groupCheckbox.controls);
  }

  get nuevaListaInput(): FormControl {
    return this.formulario.get('nuevocheckboxListaFavorito') as FormControl;
  }

  constructor() {
    combineLatest([this.ids.id$, this.paisDataService.pais$, this.ciudadDataService.ciudad$])
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(([id, pais, ciudad]) => {
        const cambioLaCiudad = pais?.codigo !== this.paisSeleccionado?.codigo || ciudad?.nombre !== this.ciudadSeleccionada?.nombre;
        this.idUsuario = id;
        this.logueado = !!id;
        this.paisSeleccionado = pais;
        this.ciudadSeleccionada = ciudad;
        // Si cambia la ciudad o se cierra la sesión con la ventana abierta, se cierra para no guardar en la equivocada.
        if (this.visible && (!id || cambioLaCiudad)) {
          this.cierraPopUp();
        }
      });
  }

  /** Pide las listas al backend y, recién con eso, abre la ventana con el estado real. */
  abrePopUp(): void {
    const id = this.idUsuario;
    if (!id) {
      this.feedback.error('mensajes.iniciarSesionFavoritos');
      return;
    }
    if (!this.paisSeleccionado) {
      this.feedback.error('mensajes.obtenerPais');
      return;
    }
    if (!this.ciudadSeleccionada) {
      this.feedback.error('mensajes.obtenerCiudad');
      return;
    }
    if (this.cargando) {
      return;
    }

    this.cargando = true;
    this.us.obtenerListasFav(id).subscribe({
      next: (listas) => {
        this.cargando = false;
        this.listasFavoritosDB = listas ?? [];
        this.pasajeDBaFormulario();
        document.body.style.overflow = 'hidden';
        this.visible = true;
      },
      error: () => {
        this.cargando = false;
        this.feedback.error('mensajes.cargarTusListas');
      }
    });
  }

  private nuevoIdLista(): string {
    let idGenerado: string;
    do {
      idGenerado = Math.random().toString(36).substring(2, 9);
    } while (this.idsGroupCheckbox.includes(idGenerado));
    return idGenerado;
  }

  agregarNuevaLista(): void {
    if (!this.nuevaListaInput.valid) {
      this.nuevaListaInput.markAsTouched();
      return;
    }
    const nuevoId = this.nuevoIdLista();
    this.mapNombresListas.set(nuevoId, this.nuevaListaInput.value.trim());
    this.groupCheckbox.addControl(nuevoId, new FormControl(true));
    this.nuevaListaInput.reset();
  }

  private ciudadEstaEn(lista: ListaFav): boolean {
    return lista.listaCiudades.some(c =>
      c.codigoPais === this.paisSeleccionado?.codigo && c.nombre === this.ciudadSeleccionada?.nombre
    );
  }

  private pasajeDBaFormulario(): void {
    const grupo = this.fb.group({});
    this.mapNombresListas.clear();
    this.listasConLaCiudad.clear();

    this.listasFavoritosDB.forEach(lista => {
      this.mapNombresListas.set(lista.idLista, lista.nombreLista);
      if (this.ciudadEstaEn(lista)) {
        this.listasConLaCiudad.add(lista.idLista);
        grupo.addControl(lista.idLista, new FormControl({ value: true, disabled: true }));
      } else {
        grupo.addControl(lista.idLista, new FormControl(false));
      }
    });

    this.formulario.setControl('checkboxesListasFavoritos', grupo);
    this.nuevaListaInput.reset();
  }

  /** Ids de las listas tildadas en las que la ciudad todavía no está (incluye las listas nuevas). */
  private listasElegidas(): string[] {
    return Object.entries(this.groupCheckbox.controls)
      .filter(([id, control]) => control.enabled && control.value === true && !this.listasConLaCiudad.has(id))
      .map(([id]) => id);
  }

  saveSelection(): void {
    const id = this.idUsuario;
    const pais = this.paisSeleccionado;
    const ciudad = this.ciudadSeleccionada;
    if (!id || !pais || !ciudad) {
      this.feedback.error('mensajes.guardarFavoritos');
      return;
    }
    if (this.guardando) {
      return;
    }

    const elegidas = this.listasElegidas();
    if (elegidas.length === 0) {
      this.feedback.error('mensajes.elegiUnaLista');
      return;
    }

    // Se arma una copia: si el backend falla, la ventana sigue mostrando lo que estaba guardado.
    const listasActualizadas: ListaFav[] = this.listasFavoritosDB.map(lista => ({
      ...lista,
      listaCiudades: [...lista.listaCiudades]
    }));
    const ciudadAGuardar = { codigoPais: pais.codigo ?? '', nombre: ciudad.nombre };

    elegidas.forEach(idLista => {
      let lista = listasActualizadas.find(l => l.idLista === idLista);
      if (!lista) {
        lista = { idLista, nombreLista: this.mapNombresListas.get(idLista) ?? '', listaCiudades: [] };
        listasActualizadas.push(lista);
      }
      lista.listaCiudades.push(ciudadAGuardar);
    });

    this.guardando = true;
    this.us.actualizarListasFavoritos(id, listasActualizadas).subscribe({
      next: () => {
        this.guardando = false;
        this.listasFavoritosDB = listasActualizadas;
        this.cierraPopUp();
        this.feedback.success('mensajes.ciudadGuardada');
      },
      error: (error) => {
        this.guardando = false;
        this.feedback.error(error.message);
      }
    });
  }

  cierraPopUp(): void {
    document.body.style.overflow = 'auto';
    this.nuevaListaInput.reset();
    this.visible = false;
  }

  cancelar(): void {
    this.cierraPopUp();
  }
}
