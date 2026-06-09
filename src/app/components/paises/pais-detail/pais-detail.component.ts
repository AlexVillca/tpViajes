import { MapComponent } from './../../map/map.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router } from '@angular/router';
import { Ciudad } from '../../../models/interface/pais.interface';
import { ConversorMonedaComponent } from '../conversor-moneda/conversor-moneda.component';
import { InfoPaisComponent } from '../info-pais/info-pais.component';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [MapComponent, CommonModule, ConversorMonedaComponent, InfoPaisComponent],
  templateUrl: './pais-detail.component.html',
  styleUrls: ['./pais-detail.component.css']
})
export class PaisDetailComponent implements OnInit {
  paisDataService = inject(PaisDataService);
  ciudadDataService = inject(CiudadDataService);
  router = inject(Router);
  pais$ = this.paisDataService.pais$;

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.router.navigate(['/ciudad']);
  }

  volver() {
    this.router.navigate(['/paises']);
  }

  setImagenError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/imagennodisponible.png';
  }
}
