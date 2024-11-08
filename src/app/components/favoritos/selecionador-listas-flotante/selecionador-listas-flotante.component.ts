import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListaCheckbox } from '../../../models/interface/datoInterno.interface';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { Ciudad } from '../../../models/interface/pais.interface';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';


/* boton para ciudad
  <button (click)="showPopup = true">Guardar</button>
  <app-selecionador-listas-flotante *ngIf="showPopup" (close)="showPopup = false"></app-selecionador-listas-flotante>
*/
@Component({
  selector: 'app-selecionador-listas-flotante',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './selecionador-listas-flotante.component.html',
  styleUrl: './selecionador-listas-flotante.component.css'
})
export class SelecionadorListasFlotanteComponent implements OnInit{

  @Output() close = new EventEmitter<void>();


  listaDeListasDB:ListaFav[] = [];
  listasFront:ListaCheckbox[] = [];

  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);

  paisDataService = inject (PaisDataService);
  ciudadDataService = inject(CiudadDataService);

  ciudadSeleccionada:any;
  paisSeleccionado:any;

  vacio:string = "";

  ngOnInit(): void {
    this.ids.id$.subscribe(
      {
        next: (id) => {
          if(id){
            this.us.obtenerListasFav(id).subscribe(
                {
                  next:(l) => {
                    this.listaDeListasDB = l
                    this.listasFront = this.listaDeListasDB.map(lista => this.mapDBaFront(lista))
                  },
                  error: (e) => {console.log(e)}
                }
            )
          }
        },
        error: (e) => {console.log(e)}
      }
    );
    //this.us.obtenerListasFav()
    this.paisDataService.pais$.subscribe(
      {
        next:(p) => {this.paisSeleccionado = p},
        error:(error) => {console.log(error)}
      }
    );
    this.ciudadDataService.ciudad$.subscribe(
      {
        next:(c) => {this.ciudadSeleccionada = c},
        error:(error) => {console.log(error)}
      }
    );
  }

  agregaNuevaLista(evento:any){
    const nombreLista:string = evento.target.value;

    evento.preventDefault(); // Evita el envío del formulario

    if(this.listasFront.length < 10){
      if (nombreLista.trim()) { // Verifica que no esté vacío
        this.listasFront.push({id:Math.random().toString(36).substring(2, 9),nombre:nombreLista,seleccionada:true});
        console.log(...this.listasFront);
        this.vacio = "";
      }else{
        console.log("esta vacio");
      }
    }else{
      //agregar small
      console.log("se llego al maximo de espacios");
    }

  }

  private mapDBaFront(lista: ListaFav):ListaCheckbox{
    let selec;
    if(lista.listaCiudades.some(c => c.codigoPais === this.paisSeleccionado.codigo && c.nombre === this.ciudadSeleccionada.nombre)){
        selec = true;
    }else{
      selec = false;
    }
    return {
      id: lista.idLista,
      nombre: lista.nombreLista,
      seleccionada: selec
    };
  }


  private pasajeCambiosFrontaDB(){
    this.listasFront.forEach(l => {
      let listaOriginal = this.listaDeListasDB.find(ldb => ldb.idLista === l.id);
      if(listaOriginal === undefined){ // se es una lista nueva
        listaOriginal = { //la agrega
          idLista:l.id,
          nombreLista:l.nombre,
          listaCiudades:[]
        }
        this.listaDeListasDB.push(listaOriginal);
      }
      //veo si concuerda
      //si posee la ciudad en la lista y
      if(listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && l.seleccionada ||
        !listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && !l.seleccionada){
          ///sin cambios
          console.log("la lista se mantiene");
      }else if(l.seleccionada){
        console.log("agrega");
          listaOriginal.listaCiudades.push({codigoPais:this.paisSeleccionado.codigo,nombre:this.ciudadSeleccionada.nombre});
      }else{
          console.log("saca");
          listaOriginal.listaCiudades = listaOriginal.listaCiudades.filter(elementoFav => !(elementoFav.codigoPais === this.paisSeleccionado.codigo && elementoFav.nombre === this.ciudadSeleccionada.nombre));

      }
    });

  }

/*
export interface ListaCheckbox {
  id:string;
  nombre: string;
  seleccionada:boolean;
}
export interface ListaFav{
  idLista:string,
  nombreLista:string,
  listaCiudades:CiudadEnLista[]
}
export interface CiudadEnLista{
  idPais:string,
  nombre:string
}

*/

  saveSelection() {
    this.pasajeCambiosFrontaDB();
    this.ids.id$.subscribe(
      {
        next:(id) => {
          if(id){
            this.us.getUsuarioById(id).subscribe(
              {
                next:(u) => {
                  if(u){
                    u.listasFavs = this.listaDeListasDB;
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
    //this.us.actualizarUsuario()
    this.closePopup();
  }

  closePopup() {
    this.close.emit();
  }

}
