import { Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ValoracionesService } from '../../../core/service/valoraciones.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { FeedbackService } from '../../../core/service/feedback.service';
import { Valoracion } from '../../../models/interface/valoracion.interface';
import { IdiomaService } from '../../../core/i18n/idioma.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-valoracion-ciudad',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './valoracion-ciudad.component.html'
})
export class ValoracionCiudadComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ciudad = '';
  @Input() paisId = '';

  private readonly servicio = inject(ValoracionesService);
  private readonly idUsuario = inject(IdUsuarioService);
  private readonly feedback = inject(FeedbackService);
  private readonly idioma = inject(IdiomaService);
  private sesion?: Subscription;

  readonly estrellas = [1, 2, 3, 4, 5];
  valoraciones: Valoracion[] = [];
  usuarioId: string | null = null;
  cargando = false;
  guardando = false;
  private pendiente: number | null = null;
  error = '';
  resaltada = 0;

  ngOnInit(): void {
    this.sesion = this.idUsuario.id$.subscribe(id => (this.usuarioId = id));
  }

  ngOnChanges(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sesion?.unsubscribe();
  }

  get cantidad(): number {
    return this.valoraciones.length;
  }

  get promedio(): number {
    if (this.cantidad === 0) return 0;
    return this.valoraciones.reduce((suma, v) => suma + v.puntaje, 0) / this.cantidad;
  }

  /** Promedio con un decimal en el formato del idioma (4,3 / 4.3). */
  get promedioTexto(): string {
    return new Intl.NumberFormat(this.idioma.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(this.promedio);
  }

  get miValoracion(): Valoracion | undefined {
    return this.usuarioId ? this.valoraciones.find(v => String(v.usuarioId) === String(this.usuarioId)) : undefined;
  }

  /** Estrella pintada en el selector: la que se está señalando o, si no, la elegida. */
  estaActiva(estrella: number): boolean {
    return estrella <= (this.resaltada || this.miValoracion?.puntaje || 0);
  }

  cargar(): void {
    if (!this.ciudad || !this.paisId) return;
    this.cargando = true;
    this.error = '';
    this.servicio.getValoraciones(this.ciudad, this.paisId).subscribe({
      next: valoraciones => {
        this.valoraciones = valoraciones;
        this.cargando = false;
      },
      error: (e: Error) => {
        this.error = e.message;
        this.cargando = false;
      }
    });
  }

  valorar(puntaje: number): void {
    // Si cambia mientras se guarda (por ejemplo, con las flechas), se guarda la última opción al terminar.
    if (this.guardando) {
      this.pendiente = puntaje;
      return;
    }
    if (puntaje === this.miValoracion?.puntaje) return;
    this.guardando = true;
    this.servicio.valorar(this.ciudad, this.paisId, puntaje, this.miValoracion).subscribe({
      next: guardada => {
        this.valoraciones = [...this.valoraciones.filter(v => v.id !== guardada.id), guardada];
        this.guardando = false;
        if (this.pendiente !== null && this.pendiente !== guardada.puntaje) {
          const siguiente = this.pendiente;
          this.pendiente = null;
          this.valorar(siguiente);
          return;
        }
        this.pendiente = null;
        this.feedback.success('mensajes.graciasValoracion');
      },
      error: (e: Error) => {
        this.guardando = false;
        this.pendiente = null;
        this.feedback.error(e.message);
      }
    });
  }
}
