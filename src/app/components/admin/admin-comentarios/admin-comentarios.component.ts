import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService, ComentarioAdmin } from '../../../core/service/admin.service';
import { FeedbackService } from '../../../core/service/feedback.service';
import { FechaPipe } from '../../../core/i18n/idioma.pipes';
import { PopUpConfirmarComponent } from '../../utils/pop-up-confirmar/pop-up-confirmar.component';

/** Moderación: todos los comentarios (los más nuevos primero), con filtro por texto y borrado con confirmación. */
@Component({
  selector: 'app-admin-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, FechaPipe, PopUpConfirmarComponent],
  templateUrl: './admin-comentarios.component.html'
})
export class AdminComentariosComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly feedback = inject(FeedbackService);
  @Output() cambio = new EventEmitter<void>();

  comentarios: ComentarioAdmin[] = [];
  cargando = true;
  error = '';
  filtro = '';
  aBorrar: ComentarioAdmin | null = null;

  ngOnInit(): void {
    this.admin.getComentarios().subscribe({
      next: lista => { this.comentarios = lista; this.cargando = false; },
      error: (e: Error) => { this.error = e.message; this.cargando = false; }
    });
  }

  get visibles(): ComentarioAdmin[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.comentarios;
    return this.comentarios.filter(c => [c.mensaje, c.usuario, c.ciudad, c.pais ?? ''].some(t => t.toLowerCase().includes(f)));
  }

  borrar(): void {
    const comentario = this.aBorrar;
    this.aBorrar = null;
    if (!comentario) return;
    this.admin.borrarComentario(comentario.id).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter(c => c.id !== comentario.id);
        this.feedback.success('admin.comentarios.borrado');
        this.cambio.emit();
      },
      error: (e: Error) => this.feedback.error(e.message)
    });
  }
}
