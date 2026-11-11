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

import { CardComponent } from '../../utils/card/card.component';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/service/feedback.service';

import { TituloListaComponent } from './titulo-lista/titulo-lista.component';
import { IdiomaService } from '../../../core/i18n/idioma.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule,CardComponent, FormsModule,TituloListaComponent, TranslatePipe],
  templateUrl: './lista.component.html'
})
export class ListaComponent implements OnInit,OnDestroy{
  activatedRoute = inject(ActivatedRoute);
  idioma = inject(IdiomaService);
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
  private cambiosPendientes = false;
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
          this.feedback.success('mensajes.nombreListaActualizado');
        },
        error:(error)=>{
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
                                this.errorCarga = e?.message ?? 'mensajes.cargarCiudades';
                                this.cargando = false;
                              }

                            }
                          )
                        } else {
                          this.errorCarga = 'mensajes.obtenerLista';
                          this.cargando = false;
                        }
                      },
                      error:(error)=>{
                        this.errorCarga = error?.message ?? 'mensajes.obtenerLista';
                        this.cargando = false;
                      }
                    }
                  )
                } else {
                  this.errorCarga = 'mensajes.usuarioActual';
                  this.cargando = false;
                }
              },
              error:(e)=>{
                this.errorCarga = e?.message ?? 'mensajes.usuarioActual';
                this.cargando = false;
              }
            }
          );
        },
        error:(e) =>{
          this.errorCarga = e?.message ?? 'mensajes.abrirLista';
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
          nombreEn: ciudad.en?.nombre,
          imagenes: imagenes
        } as ImagenesCiudad;

      }).filter((x): x is ImagenesCiudad => x != null);

  }

  accederCiudad(ciudadSelec:CiudadEnLista){
    this.paisesService.getPaises().subscribe(
      {
        next:(p)=>{
          const paisRequerido = p.find(pais => pais.codigo === ciudadSelec.codigoPais);

          if(paisRequerido === undefined){
            this.feedback.error('mensajes.paisNoEncontrado');
            return;
          }

          if(paisRequerido.ciudades === undefined){
            this.feedback.error('mensajes.paisSinCiudades');
            return;
          }

          const ciudadCargar = paisRequerido.ciudades.find(c => c.nombre === ciudadSelec.nombre);
          if(ciudadCargar){
            this.paisDataService.setPais(paisRequerido);
            this.ciudadDataService.setCiudad(ciudadCargar);
            this.router.navigate(['/ciudad', paisRequerido.id, ciudadCargar.nombre]);
          }else{
            this.feedback.error('mensajes.ciudadNoEncontrada');
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
      this.feedback.error('mensajes.quitarCiudad');
    }

  }

  eliminarLista(){
    if(this.lista == undefined) return;
    this.usuariosService.eliminarListaFavoritos(this.lista!.idLista,this.idUsuario).subscribe(
    {
      next:()=>{
        this.listaEliminada = true;
        this.cambiosPendientes = false;
        this.feedback.success('mensajes.listaEliminada');
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

  /** Nombre de la ciudad en el idioma de la interfaz. */
  tituloCiudad(item: ImagenesCiudad): string {
    return this.idioma.esIngles && item.nombreEn ? item.nombreEn : item.ciudad.nombre;
  }

}

