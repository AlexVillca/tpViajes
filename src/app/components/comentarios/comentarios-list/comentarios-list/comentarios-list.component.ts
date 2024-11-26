import { IdUsuarioService } from './../../../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Comentario } from '../../../../models/interface/pais.interface';
import { ComentariosService } from '../../../../core/service/comentarios.service';
import { ComentariosComponent } from '../../comentarios/comentarios.component';
import { UsuariosService } from '../../../../core/service/usuarios.service';
import { CiudadDataService } from '../../../../core/service/ciudad-data.service';

@Component({
  selector: 'app-comentarios-list',
  standalone: true,
  imports: [CommonModule,ComentariosComponent],
  templateUrl: './comentarios-list.component.html',
  styleUrl: './comentarios-list.component.css'
})
export class ComentariosListComponent implements OnInit {

  listaComentarios: Comentario[] = [

  ]

  flag:boolean = false;
  cds = inject(CiudadDataService)
  ciudadActual: string = '';
  ngOnInit(): void {
    this.cargarComentarios();

    this.idUsuarioService.id$.subscribe((valor) => {

      if(valor !== null){
        this.flag = true;


      }else{
        this.flag = false;
      }

      this.cds.ciudad$.subscribe(ciudad => {
        if (ciudad) {
          this.ciudadActual = ciudad.nombre;
        }
      })
    });
  }
  cs = inject(ComentariosService);
  idUsuarioService = inject(IdUsuarioService);


  cargarComentarios() {
     this.cs.getComentarios().subscribe({
      next: (comentarios : Comentario[]) => {
        this.listaComentarios = comentarios
      }
     })
  }   


  agregarComentarioDb(comentario : Comentario){
    this.listaComentarios.push(comentario);
    console.log("comentario cargado")
  }

  getCiudadActual() : string{
    return this.ciudadActual;
  }
  getComentariosDeCiudadActual(): Comentario[] {
    return this.listaComentarios.filter(comentario => comentario.ciudad === this.getCiudadActual());
  }
  
}
