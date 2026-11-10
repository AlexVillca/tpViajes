import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClimaService, ClimaActual } from '../../../core/service/clima.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NumeroPipe } from '../../../core/i18n/idioma.pipes';

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

  clima: ClimaActual | null = null;
  cargando = false;
  error: string | null = null;

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
