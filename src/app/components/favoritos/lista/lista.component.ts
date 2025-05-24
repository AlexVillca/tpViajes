import { CiudadEnLista, ListaFav } from './../../../models/interface/usuario.interface';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PaisesService } from '../../../core/service/paises.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent implements OnInit,OnDestroy{
  ars = inject(ActivatedRoute);
  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);

  ciudadService = inject(CiudadDataService);
  paisesService = inject(PaisDataService);
  router = inject(Router);
  ps = inject(PaisesService);
  locationService = inject(Location);
  lista:ListaFav = {
    idLista:"",
    nombreLista:"",
    listaCiudades: []
  }; //listaFav

  private idLista:string = "";
  private idUsuario = "";
  nombre:string ="";

  ngOnInit(): void {
    this.ars.paramMap.subscribe(
      {
        next:(param)=>{
          this.idLista = param.get('idLista') ?? "";
          this.ids.id$.subscribe(
            {
              next:(idUsuarioLogueado)=>{
                if(idUsuarioLogueado){
                  this.idUsuario = idUsuarioLogueado;
                  this.us.obtenerListasFav(idUsuarioLogueado).subscribe(
                    {
                      next:(listas)=>{

                          this.lista = listas.find(l => l.idLista === this.idLista) ??
                          {
                            idLista: "",
                            nombreLista: "",
                            listaCiudades: []
                          };
                          this.nombre = this.lista.nombreLista;

                      },
                      error:(error)=>{console.log(error)}
                    }
                  )
                }
              },
              error:(e)=>{console.log(e)}
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

  ngOnDestroy(): void {
    this.guardarCambios();
  }
  guardarCambios(){
     this.us.obtenerListasFav(this.idUsuario).subscribe(
      {
        next:(listas)=>{
          for(let i = 0;i<listas.length;i++){
            if(listas[i].idLista === this.idLista){
               listas[i].listaCiudades = this.lista.listaCiudades;
            }
          }
          this.us.actualizarListasFavoritos(this.idUsuario,listas).subscribe({
            next:(resp)=>{console.log(resp);},
            error:(error)=>{ console.log(error)}
          });
        },
        error:(error)=>{ console.log(error) }
      }
    )
  }

  eliminarDeLaLista(ciudad:CiudadEnLista){

    let index = this.lista.listaCiudades.indexOf(ciudad);
    if(index >= 0){
      this.lista.listaCiudades.splice(index,1);
    }else{
      console.log("error, no hay un elemento que cumpla el requisito");
    }
  }
  eliminarLista(){
    this.us.obtenerListasFav(this.idUsuario).subscribe(
      {
        next:(listas)=>{
          for(let i = 0;i<listas.length;i++){
            if(listas[i].idLista === this.idLista){
               listas.splice(i,1);
            }
          }
          this.us.actualizarListasFavoritos(this.idUsuario,listas).subscribe({
            next:(resp)=>{
              console.log(resp);
              this.locationService.back();
            },
            error:(error)=>{ console.log(error)}
          });
        },
        error:(error)=>{ console.log(error) }
      }
    )
  }

  volver() {
    this.locationService.back();
  }

  containerVisible = false;
  videoLoaded = false;

  // Esta función se llama cuando el video se carga completamente
  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');  // Añadir la clase 'visible' a los botones
      });
    }, 200);  // Se espera 200ms para asegurarse de que todo se renderice correctamente
    setTimeout(() => {
      this.containerVisible = true;
    }, 200); // Retraso en milisegundos
  }



}
