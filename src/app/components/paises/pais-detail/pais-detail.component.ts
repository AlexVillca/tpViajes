import { MapComponent } from './../../map/map.component';
import { Component, inject, Injectable } from '@angular/core';
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
export class PaisDetailComponent{
  paisDataService = inject (PaisDataService);
  ciudadDataService = inject (CiudadDataService);
  router = inject(Router);
  pais$ = this.paisDataService.pais$;


  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.router.navigate(['/ciudad']);
  }

  volver() {
    this.router.navigate(['/paises']);
  }
}
