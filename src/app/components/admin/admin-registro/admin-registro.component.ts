import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AccionRegistro, AdminService } from '../../../core/service/admin.service';
import { FechaPipe } from '../../../core/i18n/idioma.pipes';

/** Registro de cambios: las últimas 100 acciones de los admins (quién, qué, sobre qué y cuándo). */
@Component({
  selector: 'app-admin-registro',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FechaPipe],
  templateUrl: './admin-registro.component.html'
})
export class AdminRegistroComponent implements OnInit {
  private readonly admin = inject(AdminService);
  acciones: AccionRegistro[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.admin.getRegistro().subscribe({
      next: lista => { this.acciones = lista; this.cargando = false; },
      error: (e: Error) => { this.error = e.message; this.cargando = false; }
    });
  }

  /** Clave de traducción de la acción; si es una acción nueva sin texto, se muestra tal cual. */
  claveAccion(accion: string): string {
    return ['editar_pais', 'ocultar_pais', 'mostrar_pais', 'borrar_comentario'].includes(accion) ? `admin.registro.acciones.${accion}` : accion;
  }
}
