import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pais } from '../../../models/interface/pais.interface';
import { RouterModule } from '@angular/router';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { Router } from '@angular/router';
import { PaisesService } from '../../../core/service/paises.service';
import { BuscadorCiudadesComponent } from '../buscador-ciudades/buscador-ciudades.component';
import { IdiomaService } from '../../../core/i18n/idioma.service';
import { TranslatePipe } from '@ngx-translate/core';
import { DatoPipe } from '../../../core/i18n/idioma.pipes';

@Component({
  selector: 'app-paises-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BuscadorCiudadesComponent, TranslatePipe, DatoPipe],
  templateUrl: './paises-list.component.html'
})
export class PaisesListComponent implements OnInit {
  paises: Pais[] = [];
  paisesFiltrados: Pais[] = [];

  paisesService = inject(PaisesService);
  paisDataService = inject(PaisDataService);
  router =  inject(Router);
  idioma = inject(IdiomaService);

  letras = 'ABCDEFGHIJKLMNOPQRSTUVZ'.split('');
  letraSeleccionada = 'todos';

  cargando = false;
  errorCarga = '';

  paginaActual = 1;
  itemsPorPagina = 12;

  ngOnInit(): void {
    this.cargarPaises();
  }

  cargarPaises(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.paisesService.getPaises().subscribe({
      next: (paises: Pais[]) => {
        this.paises = paises;
        this.filtrarPaises(this.letraSeleccionada);
        this.cargando = false;
      },
      error: (error) => {
        this.errorCarga = error?.message ?? 'mensajes.cargarPaises';
        this.cargando = false;
      }
    });
  }


  filtrarPaises(letra: string) {
    this.letraSeleccionada = letra;

    if (!letra || letra === 'todos') {
      this.paisesFiltrados = this.paises;
    } else {
      // Se filtra por el nombre que se ve en pantalla (en inglés, "Germany" va con la G).
      this.paisesFiltrados = this.paises.filter(pais =>
        this.idioma.dato(pais, 'nombre').toLowerCase().startsWith(letra.toLowerCase())
      );
    }

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.paisesFiltrados.length / this.itemsPorPagina));
  }

  get paisesPagina(): Pais[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.paisesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  get mensajeVacio(): string {
    if (this.letraSeleccionada === 'todos') {
      return 'mensajes.sinPaises';
    }

    return 'mensajes.sinPaisesLetra';
  }

  seleccionarPais(pais: Pais) {
    this.paisDataService.setPais(pais);
    this.router.navigate(['/pais']);
  }

}
