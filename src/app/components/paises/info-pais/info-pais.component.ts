import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestCountriesService, PaisInfo } from '../../../core/service/rest-countries.service';

@Component({
  selector: 'app-info-pais',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-pais.component.html',
  styleUrls: ['./info-pais.component.css']
})
export class InfoPaisComponent implements OnInit {
  // Codigo ISO alpha-2 del pais (campo "codigo" de la db, ej: "AR").
  @Input() codigo?: string;

  private rest = inject(RestCountriesService);

  info: PaisInfo | null = null;
  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    if (!this.codigo) {
      this.error = 'No hay código de país para consultar.';
      return;
    }
    this.cargando = true;
    this.rest.getInfoPais(this.codigo).subscribe({
      next: (data) => {
        this.info = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'No se pudo obtener la información.';
        this.cargando = false;
      }
    });
  }
}
