import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClimaService, ClimaActual } from '../../../core/service/clima.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NumeroPipe } from '../../../core/i18n/idioma.pipes';
import { IdiomaService } from '../../../core/i18n/idioma.service';

@Component({
  selector: 'app-clima-ciudad',
  standalone: true,
  imports: [CommonModule, TranslatePipe, NumeroPipe],
  templateUrl: './clima-ciudad.component.html'
})
export class ClimaCiudadComponent implements OnInit {
  @Input() ciudad?: string;
  @Input() codigoPais?: string | null;

  private climaService = inject(ClimaService);
  private idioma = inject(IdiomaService);

  clima: ClimaActual | null = null;
  cargando = false;
  error: string | null = null;

  /** Día de la semana abreviado en el idioma actual (lun / Mon). */
  diaCorto(fecha: string): string {
    const d = new Date(`${fecha}T00:00:00`);
    const texto = new Intl.DateTimeFormat(this.idioma.locale, { weekday: 'short' }).format(d);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  ngOnInit(): void {
    if (!this.ciudad) {
      this.error = 'mensajes.sinCiudadClima';
      return;
    }

    this.cargando = true;
    this.climaService.getClima(this.ciudad, this.codigoPais).subscribe({
      next: (data) => {
        this.clima = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'mensajes.obtenerClima';
        this.cargando = false;
      }
    });
  }
}
