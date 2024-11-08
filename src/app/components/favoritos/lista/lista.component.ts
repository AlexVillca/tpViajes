import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CiudadEnLista, ListaFav } from '../../../models/interface/usuario.interface';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PaisesService } from '../../../core/service/paises.service';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent implements OnInit{
  ars = inject(ActivatedRoute);
  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);
  ciudadService = inject(CiudadDataService);
  paisesService = inject(PaisDataService);
  router = inject(Router);
  ps = inject(PaisesService);
  lista:any;

  ngOnInit(): void {
    this.ars.paramMap.subscribe(
      {
        next:(param)=>{
          let idListaRecibido = param.get('idLista');
          this.ids.id$.subscribe(
            {
              next:(idUsuario)=>{
                if(idUsuario){
                  this.us.obtenerListasFav(idUsuario).subscribe(
                    {
                      next:(listas)=>{
                        this.lista = listas.find(l => l.idLista === idListaRecibido);
                      },
                      error:(error)=>{console.log(error)}
                    }
                  )
                }
              },
              error:()=>{}
            }
          );
        },
        error:(e) =>{console.log(e)}
      }
    );
  }
  accederCiudad(ciudadSelec:CiudadEnLista){

    var ciudadCargar = null;
    console.log("entro a funcion")
    this.ps.getPaises().subscribe(
      {
        next:(p)=>{
          let paisRequerido = p.find(pais => pais.codigo === ciudadSelec.codigoPais);

          if(paisRequerido !== undefined){

            if(paisRequerido.ciudades !== undefined){
              ciudadCargar = paisRequerido.ciudades.find(c => c.nombre === ciudadSelec.nombre);
              if(ciudadCargar){
                this.paisesService.setPais(paisRequerido);
                this.ciudadService.setCiudad(ciudadCargar);
                this.router.navigate(['/ciudad']);

              }else{
                console.log("No se pudo encontrar la ciudad");
              }
            }else{
              console.log("el pais no posee ciudades");
            }
          }

        },
        error:(e)=>{console.log(e)}
      }
    )
    console.log("termina la funcion");

  }

}
