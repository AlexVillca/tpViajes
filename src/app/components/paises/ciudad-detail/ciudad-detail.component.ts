import { ComentariosListComponent } from './../../comentarios/comentarios-list/comentarios-list/comentarios-list.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, map, take } from 'rxjs';

import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { ComentariosComponent } from '../../comentarios/comentarios/comentarios.component';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PopUpGuardarFavoritosComponent } from '../../favoritos/pop-up-guardar-favoritos/pop-up-guardar-favoritos.component';
import { ClimaCiudadComponent } from '../clima-ciudad/clima-ciudad.component';

@Component({
  selector: 'app-ciudad-detail',
  standalone: true,
  imports: [ComentariosListComponent
    ,CommonModule
    ,PopUpGuardarFavoritosComponent
    ,ClimaCiudadComponent, RouterLink],
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
    this.idus.id$.subscribe({
      next:(id) => {
        if(id){
          this.usuarioLogueado = true;
        console.log("logueado");
      }else{
        this.usuarioLogueado = false;
        console.log("no logueado");
      }},
      error:() => {console.log("error al comprobar log")}
    });
  }
  constructor(private ciudadDataService: CiudadDataService, private router: Router) { }

  volver() {
    this.destinoRegreso$.pipe(take(1)).subscribe(destino => {
      this.router.navigate([destino]);
    });
  }
  setImagenError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/imagennodisponible.png';
  }

}
