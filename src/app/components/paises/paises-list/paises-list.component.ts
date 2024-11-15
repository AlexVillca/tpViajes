import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
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
export class PaisesListComponent implements OnInit, AfterViewInit {
  paises: Pais[] = [];
  paisesFiltrados: Pais[] = [];
  letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letraSeleccionada = 'todos'; // Almacena la letra seleccionada para filtrar

  paisesService = inject(PaisesService);
  paisDataService = inject(PaisDataService);
  router = inject(Router);

  ngOnInit(): void {
    this.paisesService.getPaises().subscribe({
      next: (paises: Pais[]) => {
        this.paises = paises;
        this.paisesFiltrados = this.paises;
      }
    });
  }

  ngAfterViewInit(): void {
    // Agregar la clase 'visible' después de que la vista esté completamente renderizada
    setTimeout(() => {
      const contenedor = document.querySelector('.contenedor');
      if (contenedor) {
        contenedor.classList.add('visible');
      }
    }, 100); // Esperar un pequeño intervalo para asegurar que el DOM esté listo
  }

  seleccionarLetra(letra: string) {
    this.letraSeleccionada = letra;
    this.filtrarPaises(letra); // Filtrar países al seleccionar una letra
  }

  filtrarPaises(letra: string) {
    if (!letra || letra === 'todos') {
      this.paisesFiltrados = this.paises; // Mostrar todos los países si no se selecciona una letra
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
