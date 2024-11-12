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
  letraSeleccionada = 'todos'; // Almacena la letra seleccionada para filtrar
  paisesFiltrados: Pais[] = []; // Almacena los paises filtrados

  seleccionarLetra(letra: string) { // Metodo que actualiza la letra seleccionada
    this.letraSeleccionada = letra;
  }

  filtrarPaises(letra: string) { // Metodo para filtrar los paies por letras
    if (!letra || letra === 'todos') {
      this.paisesFiltrados = this.paises; // Si no se selecciona una letra o se selecciona "todos", muestra todos los países
    } else {
      this.paisesFiltrados = this.paises.filter(pais =>
        pais.nombre.toLowerCase().startsWith(letra.toLowerCase()) // Filtra los países cuyo nombre empieza con la letra seleccionada (ignorando mays/min)
      );
    }
  }

  seleccionarPais(pais: Pais) { // Metodo para seleccionar pais
    this.paisDataService.setPais(pais); // Guarda el país seleccionado en el servicio PaisDataService
    this.router.navigate(['/pais']); // Navega a la ruta '/pais' para mostrar el detalle del país
  }
}
