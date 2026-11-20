import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService, ResumenAdmin } from '../../core/service/admin.service';
import { AdminCatalogoComponent } from './admin-catalogo/admin-catalogo.component';
import { AdminComentariosComponent } from './admin-comentarios/admin-comentarios.component';
import { AdminRegistroComponent } from './admin-registro/admin-registro.component';
import { NumeroPipe } from '../../core/i18n/idioma.pipes';

type Pestania = 'catalogo' | 'comentarios' | 'registro';

/** Panel de administración: números generales y pestañas de catálogo, comentarios y registro de cambios. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, TranslatePipe, NumeroPipe, AdminCatalogoComponent, AdminComentariosComponent, AdminRegistroComponent],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);

  resumen: ResumenAdmin | null = null;
  errorResumen = '';
  pestania: Pestania = 'catalogo';
  readonly pestanias: Pestania[] = ['catalogo', 'comentarios', 'registro'];

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.admin.getResumen().subscribe({
      next: resumen => { this.resumen = resumen; this.errorResumen = ''; },
      error: (e: Error) => { this.errorResumen = e.message; }
    });
  }

  /** Flechas izquierda/derecha entre pestañas, como pide el patrón de tabs accesibles. */
  moverPestania(evento: KeyboardEvent, actual: Pestania): void {
    const i = this.pestanias.indexOf(actual);
    const siguiente = evento.key === 'ArrowRight' ? i + 1 : evento.key === 'ArrowLeft' ? i - 1 : null;
    if (siguiente === null) return;
    evento.preventDefault();
    this.pestania = this.pestanias[(siguiente + this.pestanias.length) % this.pestanias.length];
    document.getElementById(`pestania-${this.pestania}`)?.focus();
  }
}
