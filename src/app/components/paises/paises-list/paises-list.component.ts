import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pais } from '../../../models/interface/pais.interface';
import { RouterModule } from '@angular/router';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { Router } from '@angular/router';
import { PaisesService } from '../../../core/service/paises.service';

@Component({
  selector: 'app-paises-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paises-list.component.html',
  styleUrls: ['./paises-list.component.css']
})
export class PaisesListComponent implements OnInit {
  paises: Pais[] = [];
  paisesFiltrados: Pais[] = [];

  paisesService = inject(PaisesService);
  paisDataService = inject(PaisDataService);
  router =  inject(Router);

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
        this.errorCarga = error?.message ?? 'No se pudieron cargar los paises.';
        this.cargando = false;
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const contenedor = document.querySelector('.contenedor');
      if (contenedor) {
        contenedor.classList.add('visible');
      }
    }, 100);
  }

  filtrarPaises(letra: string) {
    this.letraSeleccionada = letra;

    if (!letra || letra === 'todos') {
      this.paisesFiltrados = this.paises;
    } else {
      this.paisesFiltrados = this.paises.filter(pais =>
        pais.nombre.toLowerCase().startsWith(letra.toLowerCase())
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
      return 'No hay paises para mostrar.';
    }

    return `No se encontraron paises con la letra ${this.letraSeleccionada.toUpperCase()}.`;
  }

  seleccionarPais(pais: Pais) {
    this.paisDataService.setPais(pais);
    this.router.navigate(['/pais']);
  }

  videoLoaded = false;

  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');
      });
    }, 200);
  }

}
