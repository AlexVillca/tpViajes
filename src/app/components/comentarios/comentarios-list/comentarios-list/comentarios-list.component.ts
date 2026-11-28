import { IdUsuarioService } from './../../../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, combineLatest, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { Comentario } from '../../../../models/interface/pais.interface';
import { ComentariosService } from '../../../../core/service/comentarios.service';
import { ComentariosComponent } from '../../comentarios/comentarios.component';
import { CiudadDataService } from '../../../../core/service/ciudad-data.service';
import { PaisDataService } from '../../../../core/service/pais-data.service';
import { FeedbackService } from '../../../../core/service/feedback.service';
import { PopUpConfirmarComponent } from '../../../utils/pop-up-confirmar/pop-up-confirmar.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-comentarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ComentariosComponent, PopUpConfirmarComponent, TranslatePipe],
  templateUrl: './comentarios-list.component.html'
})
export class ComentariosListComponent implements OnInit {
  listaComentarios: Comentario[] = [];

  flag = false;
  currentUserId = '';

  cargando = false;
  errorCarga = '';

  comentarioEnEdicionId: string | null = null;
  mensajeEditado = '';
  errorEdicion = '';

  comentarioAEliminar: Comentario | null = null;

  /** Paginación local: se muestran primero los comentarios más nuevos. */
  readonly comentariosPorPagina = 5;
  paginaActual = 1;

  cds = inject(CiudadDataService);
  pds = inject(PaisDataService);
  cs = inject(ComentariosService);
  idUsuarioService = inject(IdUsuarioService);
  feedback = inject(FeedbackService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.idUsuarioService.id$.subscribe((id) => {
      this.currentUserId = id ?? '';
      this.flag = !!id;
    });

    this.cargarComentarios();
  }

  /**
   * Pide a la API solo los comentarios de la ciudad y el país que se están viendo, y los vuelve a pedir
   * cada vez que cambia alguno de los dos. switchMap descarta la respuesta de una ciudad anterior si
   * llega tarde, y takeUntilDestroyed corta todo al salir de la pantalla.
   */
  private cargarComentarios(): void {
    combineLatest([this.pds.pais$, this.cds.ciudad$]).pipe(
      map(([pais, ciudad]) => ({ paisId: pais?.id ?? '', ciudad: ciudad?.nombre ?? '' })),
      distinctUntilChanged((a, b) => a.paisId === b.paisId && a.ciudad === b.ciudad),
      tap(() => {
        this.listaComentarios = [];
        this.paginaActual = 1;
        this.errorCarga = '';
        this.cargando = true;
      }),
      switchMap(({ paisId, ciudad }) => !paisId || !ciudad ? of([]) :
        this.cs.getComentarios(paisId, ciudad).pipe(
          catchError(error => {
            this.errorCarga = error.message;
            return of([]);
          })
        )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(comentarios => {
      this.listaComentarios = comentarios;
      this.cargando = false;
    });
  }

  agregarComentarioDb(comentario: Comentario): void {
    this.listaComentarios = [...this.listaComentarios, comentario];
    this.paginaActual = 1;
  }

  esComentarioPropio(comentario: Comentario): boolean {
    return !!this.currentUserId && comentario.usuarioId === this.currentUserId;
  }

  iniciarEdicion(comentario: Comentario): void {
    if (!this.esComentarioPropio(comentario) || !comentario.id) {
      return;
    }

    this.comentarioEnEdicionId = comentario.id;
    this.mensajeEditado = comentario.mensaje;
    this.errorEdicion = '';
  }

  cancelarEdicion(): void {
    this.comentarioEnEdicionId = null;
    this.mensajeEditado = '';
    this.errorEdicion = '';
  }

  guardarEdicion(comentario: Comentario): void {
    if (!comentario.id) {
      return;
    }

    const mensajeNormalizado = this.mensajeEditado.trim();

    if (mensajeNormalizado.length < 3) {
      this.errorEdicion = 'mensajes.comentarioMinimo';
      return;
    }

    this.cs.updateComentario(comentario.id, { mensaje: mensajeNormalizado }).subscribe({
      next: (comentarioActualizado) => {
        this.listaComentarios = this.listaComentarios.map((item) =>
          item.id === comentarioActualizado.id ? comentarioActualizado : item
        );

        this.cancelarEdicion();
        this.feedback.success('mensajes.comentarioEditado');
      },
      error: (error) => {
        this.feedback.error(error.message);
      }
    });
  }

  pedirEliminar(comentario: Comentario): void {
    if (!this.esComentarioPropio(comentario) || !comentario.id) {
      return;
    }

    this.comentarioAEliminar = comentario;
  }

  cancelarEliminar(): void {
    this.comentarioAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.comentarioAEliminar?.id) {
      return;
    }

    const comentarioId = this.comentarioAEliminar.id;

    this.cs.deleteComentario(comentarioId).subscribe({
      next: () => {
        this.listaComentarios = this.listaComentarios.filter(
          (item) => item.id !== comentarioId
        );

        this.cancelarEliminar();
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas);
        this.feedback.success('mensajes.comentarioEliminado');
      },
      error: (error) => {
        this.feedback.error(error.message);
      }
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.getComentariosDeCiudadActual().length / this.comentariosPorPagina));
  }

  /** Comentarios de la página actual, del más nuevo al más viejo. */
  get comentariosPagina(): Comentario[] {
    const pagina = Math.min(this.paginaActual, this.totalPaginas);
    const inicio = (pagina - 1) * this.comentariosPorPagina;
    return [...this.getComentariosDeCiudadActual()].reverse().slice(inicio, inicio + this.comentariosPorPagina);
  }

  paginaAnterior(): void {
    this.paginaActual = Math.max(1, this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    this.paginaActual = Math.min(this.totalPaginas, this.paginaActual + 1);
  }

  /** La lista ya viene filtrada por la API: son solo los comentarios de esta ciudad de este país. */
  getComentariosDeCiudadActual(): Comentario[] {
    return this.listaComentarios;
  }
}
