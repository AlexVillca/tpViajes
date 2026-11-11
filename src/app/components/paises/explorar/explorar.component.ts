import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Pais } from '../../../models/interface/pais.interface';
import { PaisesService } from '../../../core/service/paises.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { BuscadorCiudadesComponent } from '../buscador-ciudades/buscador-ciudades.component';
import { MapaPaisesComponent } from '../mapa-paises/mapa-paises.component';

/** Página de exploración: buscador general (países y ciudades) arriba, y un mapa mundial abajo. */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BuscadorCiudadesComponent, MapaPaisesComponent],
  templateUrl: './explorar.component.html'
})
export class ExplorarComponent implements OnInit {
  private readonly paisesService = inject(PaisesService);
  private readonly paisData = inject(PaisDataService);
  private readonly router = inject(Router);

  paises: Pais[] = [];
  paisesVisibles: Pais[] = [];
  continentes: string[] = [];
  continenteSeleccionado = 'todos';
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargando = true;
    this.paisesService.getPaises().subscribe({
      next: (paises) => {
        this.paises = paises;
        this.continentes = [...new Set(paises.map(p => p.continente).filter((c): c is string => !!c))]
          .sort((a, b) => a.localeCompare(b, 'es'));
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: (e: Error) => { this.error = e.message; this.cargando = false; }
    });
  }

  filtrar(continente: string): void {
    this.continenteSeleccionado = continente;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    this.paisesVisibles = this.continenteSeleccionado === 'todos'
      ? this.paises
      : this.paises.filter(p => p.continente === this.continenteSeleccionado);
  }

  abrirPais(pais: Pais): void {
    this.paisData.setPais(pais);
    this.router.navigate(['/pais']);
  }
}
