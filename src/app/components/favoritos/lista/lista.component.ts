import { CiudadEnLista, ListaFav } from './../../../models/interface/usuario.interface';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Pais } from '../../../models/interface/pais.interface';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PaisesService } from '../../../core/service/paises.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ImagenesCiudad } from '../../../models/interface/imagenesLista.interface';

import { CardEliminarComponent } from '../../utils/card-eliminar/card-eliminar.component';
import { FormsModule } from '@angular/forms';


import { TituloListaComponent } from './titulo-lista/titulo-lista.component';


@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule,CardEliminarComponent, FormsModule,TituloListaComponent],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent implements OnInit,OnDestroy{
  activatedRoute = inject(ActivatedRoute);
  usuariosService = inject(UsuariosService);
  idUsuarioService = inject(IdUsuarioService);
  ciudadDataService = inject(CiudadDataService);
  paisDataService = inject(PaisDataService);
  router = inject(Router);
  paisesService = inject(PaisesService);
  locationService = inject(Location);

  lista:ListaFav | undefined;
  listaImagenes:ImagenesCiudad[] = [];

  private idLista:string = "";
  idUsuario:string = "";




  guardarNuevoTitulo(titulo:string):void{
    if(this.lista == null) return;
    this.lista.nombreLista = titulo;

    this.usuariosService.actualizarListaFavoritos(this.idUsuario,this.lista).subscribe(
      {
        next:(response)=>{console.log(response)},
        error:(error)=>{console.log(error)}
      }
    )

  }



  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(
      {
        next:(param)=>{
          this.idLista = param.get('idLista') ?? "";
          this.idUsuarioService.id$.subscribe(
            {
              next:(idUsuarioLogueado)=>{
                if(idUsuarioLogueado){
                  this.idUsuario = idUsuarioLogueado;
                  this.usuariosService.obtenerListaFav(this.idUsuario,this.idLista).subscribe(
                    {
                      next:(listaObtenida)=>{
                        if(listaObtenida != undefined){
                          this.lista = listaObtenida;


                          this.paisesService.getPaises().subscribe(
                            {
                              next:(listaPaises)=>{
                                this.obtenerImagenesCiudades(listaObtenida,listaPaises);
                              },
                              error:(e)=>{console.log(e)}

                            }
                          )
                        }
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


  obtenerImagenesCiudades(listaFav: ListaFav, paises: Pais[]): void {
    if(this.lista == null){return;}
    this.listaImagenes = this.lista.listaCiudades.map(ciudadEnListada => {

      const pais = paises.find(p => p.codigo === ciudadEnListada.codigoPais);
      if (!pais) return;

      const ciudad = pais.ciudades?.find(c => c.nombre === ciudadEnListada.nombre);
      if (!ciudad) return;

      const imagenes: string[] = [];

      if (ciudad.atracciones != undefined && ciudad.atracciones.length>0)
        if (ciudad.atracciones[0].imagen) imagenes.push(ciudad.atracciones[0].imagen);

        return {
          ciudad: {
            codigoPais: pais.codigo,
            nombre: ciudad.nombre},
          imagenes: imagenes
        } as ImagenesCiudad;

      }).filter((x): x is ImagenesCiudad => x !== null);

  }

  accederCiudad(ciudadSelec:CiudadEnLista){

    var ciudadCargar = null;

    this.paisesService.getPaises().subscribe(
      {
        next:(p)=>{
          const paisRequerido = p.find(pais => pais.codigo === ciudadSelec.codigoPais);

          if(paisRequerido !== undefined){

            if(paisRequerido.ciudades !== undefined){
              ciudadCargar = paisRequerido.ciudades.find(c => c.nombre === ciudadSelec.nombre);
              if(ciudadCargar){
                this.paisDataService.setPais(paisRequerido);
                this.ciudadDataService.setCiudad(ciudadCargar);
                this.router.navigate(['/ciudad']);

              }else{
                console.log("No se pudo encontrar la ciudad");
              }
            }else{
              console.log("El pais no posee ciudades");
            }
          }

        },
        error:(e)=>{console.log(e)}
      }
    )
    console.log("Termina la funcion");

  }

  ngOnDestroy(): void {
    this.guardarCambios();
  }


  guardarCambios(){
    if(this.lista === undefined){
      return;
    }
     this.usuariosService.obtenerListasFav(this.idUsuario).subscribe(
      {
        next:(listas)=>{
          console.log(listas);
          for(let i = 0;i<listas.length;i++){
            if(listas[i].idLista === this.idLista){

              if(this.lista)

                listas[i].listaCiudades = this.lista.listaCiudades;
              }

          }
          this.usuariosService.actualizarListasFavoritos(this.idUsuario,listas).subscribe({
            next:(resp)=>{console.log(resp);},
            error:(error)=>{ console.log(error)}
          });
        },
        error:(error)=>{ console.log(error) }
      }
    )
  }

  eliminarDeLaLista(ciudadEliminar:CiudadEnLista){

    if(!(this.lista && this.lista)){
      return;
    }

    let index = this.lista.listaCiudades.findIndex(c => c.codigoPais === ciudadEliminar.codigoPais && c.nombre === ciudadEliminar.nombre);

    if(index >= 0){

      this.lista.listaCiudades = this.lista.listaCiudades.filter(c => !(c.codigoPais == ciudadEliminar.codigoPais && c.nombre == ciudadEliminar.nombre));

      this.listaImagenes = this.listaImagenes.filter(c => !(c.ciudad.codigoPais == ciudadEliminar.codigoPais && c.ciudad.nombre == ciudadEliminar.nombre));

    }else{
      console.log("error, no hay un elemento que cumpla el requisito");
    }



  }


  eliminarLista(){
    console.log("se eliminara");
    if(this.lista == undefined) return;
    console.log("se eliminara");
    this.usuariosService.eliminarListaFavoritos(this.lista!.idLista,this.idUsuario).subscribe(
    {
      next:(response)=>{
        this.locationService.back();
        console.log("se elimino");
      },
      error:(error)=>{ console.log(error)}
    });
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
      this.containerVisible = true;

    }, 200); // Retraso en milisegundos
  }



}


