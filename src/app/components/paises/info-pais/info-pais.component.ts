import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
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
export class InfoPaisComponent implements OnInit, OnDestroy {
  @Input() codigo?: string;

  private rest = inject(RestCountriesService);
  private idioma = inject(IdiomaService);

  info: PaisInfo | null = null;
  cargando = false;
  error: string | null = null;

  /** Hora actual en el destino (HH:MM) y diferencia en horas respecto a la del usuario. */
  horaLocal = '';
  diferenciaHoras = 0;
  private reloj?: ReturnType<typeof setInterval>;

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
        this.iniciarReloj();
      },
      error: (err) => {
        this.error = err?.message ?? 'mensajes.obtenerInformacion';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.reloj) clearInterval(this.reloj);
  }

  private iniciarReloj(): void {
    this.actualizarHora();
    this.reloj = setInterval(() => this.actualizarHora(), 30000);
  }

  /** Minutos de desfase respecto a UTC de la primera zona horaria ("UTC+01:00" -> 60). */
  private offsetDestinoMin(): number | null {
    const tz = this.info?.zonasHorarias?.[0];
    if (!tz) return null;
    if (tz === 'UTC') return 0;
    const m = /^UTC([+-])(\d{2}):(\d{2})$/.exec(tz);
    if (!m) return null;
    return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  }

  private actualizarHora(): void {
    const off = this.offsetDestinoMin();
    if (off === null) { this.horaLocal = ''; return; }
    // El epoch desplazado por el offset, leído en UTC, da la hora de pared del destino.
    const d = new Date(Date.now() + off * 60000);
    this.horaLocal = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    const offUsuario = -new Date().getTimezoneOffset();
    this.diferenciaHoras = Math.round((off - offUsuario) / 60);
  }

  region(nombre: string): string {
    return this.idioma.esIngles ? nombre : REGIONES_ES[nombre] ?? nombre;
  }

  limitrofes(info: PaisInfo): string[] {
    return this.idioma.esIngles && info.limitrofesEn?.length ? info.limitrofesEn : info.limitrofes;
  }
}
