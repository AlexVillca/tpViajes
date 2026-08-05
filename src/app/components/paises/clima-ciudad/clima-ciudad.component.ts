import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClimaService, ClimaActual } from '../../../core/service/clima.service';

@Component({
  selector: 'app-clima-ciudad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clima-ciudad.component.html',
  styleUrls: ['./clima-ciudad.component.css']
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
      this.error = 'No hay ciudad para consultar el clima.';
      return;
    }

    this.cargando = true;
    this.climaService.getClima(this.ciudad, this.codigoPais).subscribe({
      next: (data) => {
        this.clima = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'No se pudo obtener el clima.';
        this.cargando = false;
      }
    });
  }
}
