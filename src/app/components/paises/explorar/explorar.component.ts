import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Pais } from '../../../models/interface/pais.interface';
import { PaisesService } from '../../../core/service/paises.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { IdiomaService } from '../../../core/i18n/idioma.service';
import { BuscadorCiudadesComponent } from '../buscador-ciudades/buscador-ciudades.component';
import { MapaPaisesComponent } from '../mapa-paises/mapa-paises.component';

/** Nombre de continente (como viene en la base) -> clave i18n, para mostrarlo en el idioma actual. */
const CLAVE_CONTINENTE: Record<string, string> = {
  'África': 'continentes.africa',
  'América Central': 'continentes.americaCentral',
  'América del Norte': 'continentes.americaNorte',
  'América del Sur': 'continentes.americaSur',
  'Asia': 'continentes.asia',
  'Europa': 'continentes.europa',
  'Oceanía': 'continentes.oceania'
};

/** Página de exploración: buscador general arriba, y abajo un mapa con una lista de países al costado. */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BuscadorCiudadesComponent, MapaPaisesComponent],
  templateUrl: './explorar.component.html'
})
export class ExplorarComponent implements OnInit, OnDestroy {
  private readonly paisesService = inject(PaisesService);
  private readonly paisData = inject(PaisDataService);
  private readonly router = inject(Router);
  private readonly idioma = inject(IdiomaService);

  paises: Pais[] = [];
  paisesVisibles: Pais[] = [];
  paisesLista: Pais[] = [];
  continentes: string[] = [];
  continenteSeleccionado = 'todos';
  cargando = false;
  error = '';
  private subIdioma?: Subscription;

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
    // Reordena la lista por el nombre en el idioma actual cuando se cambia de idioma.
    this.subIdioma = this.idioma.idioma$.subscribe(() => this.ordenarLista());
  }

  ngOnDestroy(): void {
    this.subIdioma?.unsubscribe();
  }

  filtrar(continente: string): void {
    this.continenteSeleccionado = continente;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    this.paisesVisibles = this.continenteSeleccionado === 'todos'
      ? this.paises
      : this.paises.filter(p => p.continente === this.continenteSeleccionado);
    this.ordenarLista();
  }

  private ordenarLista(): void {
    this.paisesLista = [...this.paisesVisibles].sort((a, b) =>
      this.nombre(a).localeCompare(this.nombre(b), this.idioma.actual)
    );
  }

  nombre(pais: Pais): string {
    return this.idioma.dato(pais, 'nombre');
  }

  claveContinente(continente: string): string {
    return CLAVE_CONTINENTE[continente] ?? continente;
  }

  abrirPais(pais: Pais): void {
    this.paisData.setPais(pais);
    this.router.navigate(['/pais']);
  }
}
