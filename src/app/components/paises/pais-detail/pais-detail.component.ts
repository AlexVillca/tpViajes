import { MapComponent } from './../../map/map.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router, RouterLink } from '@angular/router';
import { Ciudad } from '../../../models/interface/pais.interface';
import { ConversorMonedaComponent } from '../conversor-moneda/conversor-moneda.component';
import { InfoPaisComponent } from '../info-pais/info-pais.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DatoPipe } from '../../../core/i18n/idioma.pipes';
import { imagenPorDefecto } from '../../../core/utils/imagen.util';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [MapComponent, CommonModule, ConversorMonedaComponent, InfoPaisComponent, RouterLink, TranslatePipe, DatoPipe],
  templateUrl: './pais-detail.component.html'
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

  setImagenError = imagenPorDefecto;
}
