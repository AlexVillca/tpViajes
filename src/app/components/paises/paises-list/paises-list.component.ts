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

  ngOnInit(): void {
    this.paisesService.getPaises().subscribe({
      next: (paises: Pais[]) => {
        this.paises = paises;
        this.paisesFiltrados = this.paises;
      }
    });
  }

  paises: Pais[] = [];

  paisesService = inject(PaisesService);
  paisDataService = inject(PaisDataService);
  router =  inject(Router);

  letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letraSeleccionada = 'todos';
  paisesFiltrados: Pais[] = [];

  seleccionarLetra(letra: string) {
    this.letraSeleccionada = letra;
  }

  filtrarPaises(letra: string) {
    if (!letra || letra === 'todos') {
      this.paisesFiltrados = this.paises;
    } else {
      this.paisesFiltrados = this.paises.filter(pais =>
        pais.nombre.toLowerCase().startsWith(letra.toLowerCase())
      );
    }
  }

  seleccionarPais(pais: Pais) {
    this.paisDataService.setPais(pais);
    this.router.navigate(['/pais']); 
  }
}
