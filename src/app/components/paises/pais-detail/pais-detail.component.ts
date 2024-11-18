import { MapComponent } from './../../map/map.component';
import { Component, inject, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router } from '@angular/router'; //
import { Ciudad } from '../../../models/interface/pais.interface';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [MapComponent,CommonModule],
  templateUrl: './pais-detail.component.html',
  styleUrls: ['./pais-detail.component.css']
})
export class PaisDetailComponent implements OnInit{
  paisDataService = inject (PaisDataService);
  ciudadDataService = inject (CiudadDataService);
  router = inject(Router);
  pais$ = this.paisDataService.pais$;

  isVisible = false; // Control de visibilidad inicial
  ngOnInit(): void {

    // Añadir la clase 'visible' después de que el componente esté completamente cargado
    setTimeout(() => {
      const container = document.querySelector('.container');
      if (container) {
        container.classList.add('visible');
      }
    }, 100); // Esperamos 100ms para garantizar que el componente esté completamente renderizado
    // Simula un retraso para mostrar la animación después de cargar
    setTimeout(() => {
      this.isVisible = true;
    }, 100); // Ajusta el tiempo según lo necesario

  }


  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.router.navigate(['/ciudad']);
  }

  volver() {
    this.router.navigate(['/paises']);

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
