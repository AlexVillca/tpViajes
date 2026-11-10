import { IdUsuarioService } from './../../../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comentario } from '../../../../models/interface/pais.interface';
import { ComentariosService } from '../../../../core/service/comentarios.service';
import { ComentariosComponent } from '../../comentarios/comentarios.component';
import { CiudadDataService } from '../../../../core/service/ciudad-data.service';
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
  ciudadActual = '';
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
  cs = inject(ComentariosService);
  idUsuarioService = inject(IdUsuarioService);
  feedback = inject(FeedbackService);

  ngOnInit(): void {
    this.cargarComentarios();

    this.idUsuarioService.id$.subscribe((id) => {
      this.currentUserId = id ?? '';
      this.flag = !!id;
    });

    this.cds.ciudad$.subscribe(ciudad => {
      this.ciudadActual = ciudad?.nombre ?? '';
      this.paginaActual = 1;
    });
  }

  cargarComentarios(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.cs.getComentarios().subscribe({
      next: (comentarios: Comentario[]) => {
        this.listaComentarios = comentarios;
        this.cargando = false;
      },
      error: (error) => {
        this.errorCarga = error.message;
        this.cargando = false;
      }
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

  getComentariosDeCiudadActual(): Comentario[] {
    return this.listaComentarios.filter(
      (comentario) => comentario.ciudad === this.ciudadActual
    );
  }
}
