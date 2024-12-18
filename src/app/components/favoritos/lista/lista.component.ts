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
  nombre:string ="";

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

                          this.lista = listas.find(l => l.idLista === idListaRecibido) ??
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
  eliminarDeLaLista(ciudad:CiudadEnLista){

    let index = this.lista.listaCiudades.indexOf(ciudad);
    if(index >= 0){
      this.lista.listaCiudades.splice(index,1);
    }else{
      console.log("error, no hay un elemento que cumpla el requisito");
    }
  }
  ngOnDestroy(): void {
    this.guardarCambios();
  }
  guardarCambios(){
    this.ids.id$.subscribe(
      {
        next:(id) => {
          if(id){
            this.us.getUsuarioById(id).subscribe(
              {
                next:(u) => {
                  if(u){
                    const pos = u.listasFavs.findIndex(l => l.idLista === this.lista.idLista);
                    u.listasFavs[pos] = this.lista;
                    u.listasFavs[pos].nombreLista = this.nombre;
                    this.us.actualizarUsuario(u).subscribe(
                      {
                        next:() => {console.log("lista favs actualizada")},
                        error:(e) => {console.log(e)}
                      }
                    );
                  }

                },
                error:() => {console.log("ERROR:no se encontro al usuario")}
              }
            );
          }


        },
        error:() => {console.log("ERROR:no se pudo obtener el id");}
      }
    );
  }
  eliminarLista(){
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

                        for(let i = 0;i<listas.length;i++){
                          if(listas[i].idLista === idListaRecibido){
                            listas.splice(i,1);
                          }
                        }


                        this.ids.id$.subscribe(
                          {
                            next:(id) => {
                              if(id){
                                this.us.getUsuarioById(id).subscribe(
                                  {
                                    next:(u) => {
                                      if(u){
                                        u.listasFavs = listas;

                                        this.us.actualizarUsuario(u).subscribe(
                                          {
                                            next:() => {this.router.navigate(['/favoritos']);},
                                            error:(e) => {console.log(e)}
                                          }
                                        );
                                      }

                                    },
                                    error:() => {console.log("ERROR:no se encontro al usuario")}
                                  }
                                );
                              }


                            },
                            error:() => {console.log("ERROR:no se pudo obtener el id");}
                          }
                        );



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
