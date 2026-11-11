import { MapComponent } from './../../map/map.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { PaisesService } from '../../../core/service/paises.service';
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
  private route = inject(ActivatedRoute);
  private paisesService = inject(PaisesService);
  pais$ = this.paisDataService.pais$;
  cargando = false;

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    this.pais$.pipe(take(1)).subscribe(actual => {
      // Camino rápido: ya tengo en memoria el país que pide la URL (llegué con un click).
      if (actual && actual.id === id) return;
      // Recarga o link compartido: rearmo el país desde el servidor a partir del id de la URL.
      if (!id) { this.router.navigate(['/paises']); return; }
      this.cargando = true;
      this.paisesService.getPaisPorId(id).subscribe({
        next: pais => {
          this.cargando = false;
          if (pais) this.paisDataService.setPais(pais);
          else this.router.navigate(['/paises']);
        },
        error: () => { this.cargando = false; this.router.navigate(['/paises']); }
      });
    });
  }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.pais$.pipe(take(1)).subscribe(pais => {
      if (pais) this.router.navigate(['/ciudad', pais.id, ciudad.nombre]);
    });
  }

  volver() {
    this.router.navigate(['/paises']);
  }

  setImagenError = imagenPorDefecto;
}
