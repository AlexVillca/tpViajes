import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router } from '@angular/router';
import { Ciudad } from '../../../models/interface/pais.interface';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pais-detail.component.html',
  styleUrls: ['./pais-detail.component.css']
})
export class PaisDetailComponent implements OnInit {
  paisDataService = inject(PaisDataService);
  ciudadDataService = inject(CiudadDataService);
  router = inject(Router);
  pais$ = this.paisDataService.pais$;

  ngOnInit(): void {
    // Añadir la clase 'visible' después de que el componente esté completamente cargado
    setTimeout(() => {
      const container = document.querySelector('.container');
      if (container) {
        container.classList.add('visible');
      }
    }, 100); // Esperamos 100ms para garantizar que el componente esté completamente renderizado
  }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.router.navigate(['/ciudad']);
  }

  volver() {
    this.router.navigate(['/paises']);
  }
}