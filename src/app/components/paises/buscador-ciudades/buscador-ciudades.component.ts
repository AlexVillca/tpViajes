import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { TranslatePipe } from '@ngx-translate/core';
import { DatoPipe } from '../../../core/i18n/idioma.pipes';
interface OpcionCiudad {
  id: string;
  ciudad: Ciudad;
  pais: Pais;
  /** Nombres de la ciudad y del país en los dos idiomas, sin acentos, para comparar. */
  claves: string[];
}

const MAXIMO_SUGERENCIAS = 8;

/** Quita acentos y mayúsculas para que "cordoba" encuentre "Córdoba". */
export function normalizarBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Buscador de ciudades con autocompletado (patrón ARIA "combobox" con lista de opciones):
 * flechas para moverse, Enter para abrir la ciudad y Escape para cerrar la lista.
 */
@Component({
  selector: 'app-buscador-ciudades',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DatoPipe],
  templateUrl: './buscador-ciudades.component.html'
})
export class BuscadorCiudadesComponent {
  private readonly paisData = inject(PaisDataService);
  private readonly ciudadData = inject(CiudadDataService);
  private readonly router = inject(Router);

  private opciones: OpcionCiudad[] = [];

  @Input() set paises(paises: Pais[]) {
    this.opciones = paises.flatMap(pais => (pais.ciudades ?? []).map((ciudad, indice) => ({
      id: `${pais.id}-${indice}`,
      ciudad,
      pais,
      claves: [ciudad.nombre, ciudad.en?.nombre, pais.nombre, pais.en?.nombre]
        .filter((valor): valor is string => !!valor)
        .map(normalizarBusqueda)
    })));
    this.actualizarSugerencias();
  }

  texto = '';
  abierto = false;
  activa = -1;
  sugerencias: OpcionCiudad[] = [];

  get idActiva(): string | null {
    return this.abierto && this.activa >= 0 ? `buscador-opcion-${this.sugerencias[this.activa].id}` : null;
  }

  alEscribir(valor: string): void {
    this.texto = valor;
    this.actualizarSugerencias();
    this.abierto = this.texto.trim().length > 0;
    this.activa = this.sugerencias.length > 0 ? 0 : -1;
  }

  alPresionarTecla(evento: KeyboardEvent): void {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (!this.abierto && this.texto.trim()) this.abierto = true;
        if (this.sugerencias.length) this.activa = (this.activa + 1) % this.sugerencias.length;
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (this.sugerencias.length) this.activa = (this.activa - 1 + this.sugerencias.length) % this.sugerencias.length;
        break;
      case 'Enter':
        if (this.abierto && this.activa >= 0) {
          evento.preventDefault();
          this.elegir(this.sugerencias[this.activa]);
        }
        break;
      case 'Escape':
        if (this.abierto) {
          evento.preventDefault();
          this.abierto = false;
        } else {
          this.texto = '';
          this.actualizarSugerencias();
        }
        break;
    }
  }

  cerrar(): void {
    this.abierto = false;
  }

  elegir(opcion: OpcionCiudad): void {
    this.paisData.setPais(opcion.pais);
    this.ciudadData.setCiudad(opcion.ciudad);
    this.abierto = false;
    this.router.navigate(['/ciudad', opcion.pais.id, opcion.ciudad.nombre]);
  }

  private actualizarSugerencias(): void {
    const buscado = normalizarBusqueda(this.texto);
    if (!buscado) {
      this.sugerencias = [];
      return;
    }
    // Primero las ciudades cuyo nombre empieza con lo escrito, después el resto de coincidencias.
    const puntaje = (opcion: OpcionCiudad) =>
      opcion.claves.slice(0, 2).some(clave => clave.startsWith(buscado)) ? 0
        : opcion.claves.some(clave => clave.startsWith(buscado)) ? 1 : 2;
    this.sugerencias = this.opciones
      .filter(opcion => opcion.claves.some(clave => clave.includes(buscado)))
      .sort((a, b) => puntaje(a) - puntaje(b)
        || a.ciudad.nombre.localeCompare(b.ciudad.nombre, 'es', { sensitivity: 'base' })
        || a.pais.nombre.localeCompare(b.pais.nombre, 'es'))
      .slice(0, MAXIMO_SUGERENCIAS);
  }
}
