import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestCountriesService, PaisInfo } from '../../../core/service/rest-countries.service';
import { IdiomaService } from '../../../core/i18n/idioma.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NumeroPipe } from '../../../core/i18n/idioma.pipes';

/** REST Countries devuelve regiones y subregiones en inglés; acá están en español. */
const REGIONES_ES: Record<string, string> = {
  'Africa': 'África',
  'Americas': 'América',
  'Antarctic': 'Antártida',
  'Asia': 'Asia',
  'Europe': 'Europa',
  'Oceania': 'Oceanía',
  'Northern Africa': 'Norte de África',
  'Eastern Africa': 'África Oriental',
  'Middle Africa': 'África Central',
  'Southern Africa': 'África Austral',
  'Western Africa': 'África Occidental',
  'Caribbean': 'Caribe',
  'Central America': 'América Central',
  'North America': 'América del Norte',
  'South America': 'América del Sur',
  'Central Asia': 'Asia Central',
  'Eastern Asia': 'Asia Oriental',
  'South-Eastern Asia': 'Sudeste Asiático',
  'Southern Asia': 'Asia del Sur',
  'Western Asia': 'Asia Occidental',
  'Central Europe': 'Europa Central',
  'Eastern Europe': 'Europa del Este',
  'Northern Europe': 'Europa del Norte',
  'Southeast Europe': 'Europa del Sudeste',
  'Southern Europe': 'Europa del Sur',
  'Western Europe': 'Europa Occidental',
  'Australia and New Zealand': 'Australia y Nueva Zelanda',
  'Melanesia': 'Melanesia',
  'Micronesia': 'Micronesia',
  'Polynesia': 'Polinesia'
};

@Component({
  selector: 'app-info-pais',
  standalone: true,
  imports: [CommonModule, TranslatePipe, NumeroPipe],
  templateUrl: './info-pais.component.html'
})
export class InfoPaisComponent implements OnInit {
  @Input() codigo?: string;

  private rest = inject(RestCountriesService);
  private idioma = inject(IdiomaService);

  info: PaisInfo | null = null;
  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    if (!this.codigo) {
      this.error = 'mensajes.sinCodigoPais';
      return;
    }
    this.cargando = true;
    this.rest.getInfoPais(this.codigo).subscribe({
      next: (data) => {
        this.info = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'mensajes.obtenerInformacion';
        this.cargando = false;
      }
    });
  }

  region(nombre: string): string {
    return this.idioma.esIngles ? nombre : REGIONES_ES[nombre] ?? nombre;
  }

  limitrofes(info: PaisInfo): string[] {
    return this.idioma.esIngles && info.limitrofesEn?.length ? info.limitrofesEn : info.limitrofes;
  }
}
