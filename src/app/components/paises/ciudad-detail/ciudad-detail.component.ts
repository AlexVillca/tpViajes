import { ComentariosListComponent } from './../../comentarios/comentarios-list/comentarios-list/comentarios-list.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, map, take } from 'rxjs';

import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PopUpGuardarFavoritosComponent } from '../../favoritos/pop-up-guardar-favoritos/pop-up-guardar-favoritos.component';
import { ClimaCiudadComponent } from '../clima-ciudad/clima-ciudad.component';
import { ValoracionCiudadComponent } from '../valoracion-ciudad/valoracion-ciudad.component';
import { MapaAtraccionesComponent } from '../mapa-atracciones/mapa-atracciones.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DatoPipe } from '../../../core/i18n/idioma.pipes';
import { imagenPorDefecto } from '../../../core/utils/imagen.util';

@Component({
  selector: 'app-ciudad-detail',
  standalone: true,
  imports: [ComentariosListComponent
    ,CommonModule
    ,PopUpGuardarFavoritosComponent
    ,ClimaCiudadComponent, ValoracionCiudadComponent, MapaAtraccionesComponent, RouterLink, TranslatePipe, DatoPipe],
  templateUrl: './ciudad-detail.component.html'
})
export class CiudadDetailComponent implements OnInit{
  paisDataService = inject(PaisDataService);
  ciudad$ = this.ciudadDataService.ciudad$;
  pais$ = this.paisDataService.pais$;
  destinoRegreso$ = combineLatest([this.pais$, this.ciudad$]).pipe(
    map(([pais, ciudad]) => pais && ciudad && pais.ciudades?.some(item => item.nombre === ciudad.nombre)
      ? '/pais' : '/paises')
  );
  idus = inject(IdUsuarioService);
  usuarioLogueado = false;

  ngOnInit(){
    window.scrollTo(0, 0);
    this.idus.id$.subscribe(id => {
      this.usuarioLogueado = !!id;
    });
  }
  constructor(private ciudadDataService: CiudadDataService, private router: Router) { }

  volver() {
    this.destinoRegreso$.pipe(take(1)).subscribe(destino => {
      this.router.navigate([destino]);
    });
  }

  /** Al tocar un pin del mapa, lleva el foco a la tarjeta de esa atracción. */
  irATarjeta(indice: number): void {
    const el = document.getElementById(`atraccion-${indice}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  setImagenError = imagenPorDefecto;

}
