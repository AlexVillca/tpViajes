import { ComentariosListComponent } from './../../comentarios/comentarios-list/comentarios-list/comentarios-list.component';
// En ciudad-detail.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Location } from '@angular/common';
import { SelecionadorListasFlotanteComponent } from '../../favoritos/selecionador-listas-flotante/selecionador-listas-flotante.component';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { ComentariosComponent } from '../../comentarios/comentarios/comentarios.component';
import { PaisDataService } from '../../../core/service/pais-data.service';



@Component({
  selector: 'app-ciudad-detail',
  standalone: true,
  imports: [ComentariosListComponent,CommonModule,SelecionadorListasFlotanteComponent,ComentariosComponent],
  templateUrl: './ciudad-detail.component.html',
  styleUrls: ['./ciudad-detail.component.css']
})
export class CiudadDetailComponent implements OnInit{
  ciudad$ = this.ciudadDataService.ciudad$;
  idus = inject(IdUsuarioService);
  usuarioLogueado = false;
  showPopup = false;
  ngOnInit(){
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
  constructor(private ciudadDataService: CiudadDataService,  private location: Location) { }

  volver() {
    this.location.back();
  }


}
