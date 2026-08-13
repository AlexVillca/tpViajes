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

@Component({
  selector: 'app-comentarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ComentariosComponent, PopUpConfirmarComponent],
  templateUrl: './comentarios-list.component.html',
  styleUrl: './comentarios-list.component.css'
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
      this.errorEdicion = 'El comentario debe tener al menos 3 caracteres.';
      return;
    }

    this.cs.updateComentario(comentario.id, { mensaje: mensajeNormalizado }).subscribe({
      next: (comentarioActualizado) => {
        this.listaComentarios = this.listaComentarios.map((item) =>
          item.id === comentarioActualizado.id ? comentarioActualizado : item
        );

        this.cancelarEdicion();
        this.feedback.success('Comentario editado.');
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
        this.feedback.success('Comentario eliminado.');
      },
      error: (error) => {
        this.feedback.error(error.message);
      }
    });
  }

  getComentariosDeCiudadActual(): Comentario[] {
    return this.listaComentarios.filter(
      (comentario) => comentario.ciudad === this.ciudadActual
    );
  }
}
