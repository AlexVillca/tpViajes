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

  ngAfterViewInit(): void {
    // Agregar la clase 'visible' después de que la vista esté completamente renderizada
    setTimeout(() => {
      const contenedor = document.querySelector('.contenedor');
      if (contenedor) {
        contenedor.classList.add('visible');
      }
    }, 100); // Esperar un pequeño intervalo para asegurar que el DOM esté listo
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

  videoLoaded = false;

  // Esta función se llama cuando el video se carga completamente
  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');  // Añadir la clase 'visible' a los botones
      });
    }, 200);  // Se espera 200ms para asegurarse de que todo se renderice correctamente
  }

}
