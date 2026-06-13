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
import { FeedbackService } from '../../../core/service/feedback.service';


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
  feedback = inject(FeedbackService);

  lista:ListaFav | undefined;
  listaImagenes:ImagenesCiudad[] = [];
  cargando = false;
  errorCarga = '';
  // Solo persistimos al salir cuando hubo cambios locales reales en la lista.
  private cambiosPendientes = false;
  // Si la lista se elimina, evitamos que ngOnDestroy intente guardarla otra vez.
  private listaEliminada = false;

  private idLista:string = "";
  idUsuario:string = "";




  guardarNuevoTitulo(titulo:string):void{
    if(this.lista == null) return;
    const tituloAnterior = this.lista.nombreLista;
    this.lista.nombreLista = titulo;

    this.usuariosService.actualizarListaFavoritos(this.idUsuario,this.lista).subscribe(
      {
        next:()=>{
          this.feedback.success('Nombre de lista actualizado.');
        },
        error:(error)=>{
          // Si el PATCH falla, devolvemos el titulo anterior para no dejar la UI inconsistente.
          if (this.lista) {
            this.lista.nombreLista = tituloAnterior;
          }
          this.feedback.error(error.message);
        }
      }
    )

  }



  ngOnInit(): void {
    this.cargando = true;
    this.errorCarga = '';

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
                                this.cargando = false;
                              },
                              error:(e)=>{
                                this.errorCarga = e?.message ?? 'No se pudieron cargar las ciudades.';
                                this.cargando = false;
                              }

                            }
                          )
                        } else {
                          this.errorCarga = 'No se pudo obtener la lista.';
                          this.cargando = false;
                        }
                      },
                      error:(error)=>{
                        this.errorCarga = error?.message ?? 'No se pudo obtener la lista.';
                        this.cargando = false;
                      }
                    }
                  )
                } else {
                  this.errorCarga = 'No se pudo obtener el usuario actual.';
                  this.cargando = false;
                }
              },
              error:(e)=>{
                this.errorCarga = e?.message ?? 'No se pudo obtener el usuario actual.';
                this.cargando = false;
              }
            }
          );
        },
        error:(e) =>{
          this.errorCarga = e?.message ?? 'No se pudo abrir la lista.';
          this.cargando = false;
        }
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
    this.paisesService.getPaises().subscribe(
      {
        next:(p)=>{
          const paisRequerido = p.find(pais => pais.codigo === ciudadSelec.codigoPais);

          if(paisRequerido === undefined){
            this.feedback.error('No se pudo encontrar el país seleccionado.');
            return;
          }

          if(paisRequerido.ciudades === undefined){
            this.feedback.error('El país seleccionado no tiene ciudades disponibles.');
            return;
          }

          const ciudadCargar = paisRequerido.ciudades.find(c => c.nombre === ciudadSelec.nombre);
          if(ciudadCargar){
            this.paisDataService.setPais(paisRequerido);
            this.ciudadDataService.setCiudad(ciudadCargar);
            this.router.navigate(['/ciudad']);
          }else{
            this.feedback.error('No se pudo encontrar la ciudad seleccionada.');
          }

        },
        error:(e)=>{
          this.feedback.error(e.message);
        }
      }
    )
  }

  ngOnDestroy(): void {
    if (!this.listaEliminada && this.cambiosPendientes) {
      this.guardarCambios();
    }
  }


  guardarCambios(){
    if(this.lista === undefined){
      return;
    }
     this.usuariosService.obtenerListasFav(this.idUsuario).subscribe(
      {
        next:(listas)=>{
          for(let i = 0;i<listas.length;i++){
            if(listas[i].idLista === this.idLista){

              if(this.lista)

                listas[i].listaCiudades = this.lista.listaCiudades;
              }

          }
          this.usuariosService.actualizarListasFavoritos(this.idUsuario,listas).subscribe({
            next:()=>{
              this.cambiosPendientes = false;
            },
            error:(error)=>{
              this.feedback.error(error.message);
            }
          });
        },
        error:(error)=>{
          this.feedback.error(error.message);
        }
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
      this.cambiosPendientes = true;

    }else{
      this.feedback.error('No se pudo quitar la ciudad de la lista.');
    }



  }


  eliminarLista(){
    if(this.lista == undefined) return;
    this.usuariosService.eliminarListaFavoritos(this.lista!.idLista,this.idUsuario).subscribe(
    {
      next:()=>{
        this.listaEliminada = true;
        this.cambiosPendientes = false;
        this.feedback.success('Lista eliminada.');
        this.locationService.back();
      },
      error:(error)=>{
        this.feedback.error(error.message);
      }
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


