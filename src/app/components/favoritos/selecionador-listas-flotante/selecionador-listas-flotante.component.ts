import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';

interface ListaCheckbox {
  id:string;
  nombre: string;
  seleccionada:boolean;
}


@Component({
  selector: 'app-selecionador-listas-flotante',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './selecionador-listas-flotante.component.html',
  styleUrl: './selecionador-listas-flotante.component.css'
})
export class SelecionadorListasFlotanteComponent implements OnInit,OnDestroy{

  fb = inject(FormBuilder);
  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);
  paisDataService = inject (PaisDataService);
  ciudadDataService = inject(CiudadDataService);
  visible = false;
  logueado = false;

  listasFavoritosDB:ListaFav[] = [];
  listasFront:ListaCheckbox[] = [];

  ciudadSeleccionada:any;
  paisSeleccionado:any;

  alertaMax = false;

  formulario:FormGroup = this.fb.group({
    nuevocheckboxListaFavorito: ['', Validators.required],
    checkboxesListasFavoritos: this.fb.array([])

  });

  //
  crearCheckboxForm(item: any): FormGroup {
    return this.fb.group({
      id: [item.id],
      nombre: [item.nombre],
      seleccionada: [item.seleccionada]
    });
  }
  //con esto trabajo directamente en los checkbox
  get arrayCheckbox(): FormArray {
    return this.formulario.get('checkboxesListasFavoritos') as FormArray;
  }
  //y con el input para una nueva lista
  get nuevaListaInput():FormControl {
    return this.formulario.get('nuevocheckboxListaFavorito') as FormControl;
  }



  ngOnInit(): void {
    this.ids.id$.subscribe(
      {
        next: (id) => {
          if(id){
            this.logueado = true;

            this.us.obtenerListasFav(id).subscribe(
                {
                  next:(l) => {
                    this.listasFavoritosDB = l;
                    //obtengo las listas
                    this.pasajeDBaFront();
                    //cargo las checkbox
                    this.pasajeListaFrontAFormulario();
                  },
                  error: (e) => {console.log(e)}
                }
            )
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
        },
        error: (e) => {console.log(e)}
      }
    );


  }

  //generar un id unico
  private nuevoIdLista():string{
    let idGenerado:string;
    do{
      idGenerado = Math.random().toString(36).substring(2, 9);
    }while(this.listasFront.some( l => l.id === idGenerado));
    return idGenerado;
  }



 // Agrega un nuevo item al FormArray
 agregarNuevaLista() {

  if(this.arrayCheckbox.length < 6){
    console.log("entro cant listas");
    console.log(this.formulario.value);

    if (this.nuevaListaInput.valid) {
      console.log("entro form valido");

      const nuevoItem = {
        id:this.nuevoIdLista() ,
        nombre: this.nuevaListaInput.value,
        seleccionada: true
      };
      this.arrayCheckbox.push(this.crearCheckboxForm(nuevoItem));
      this.nuevaListaInput.reset();
    }else{

    }
  }else{
    this.alertaMax = true;

    setTimeout(() => {
      this.alertaMax = false;
    }, 4000);
  }
}
  private pasajeDBaFront(){
    this.listasFront = this.listasFavoritosDB.map(lista => {
      let selec;
      if(lista.listaCiudades.some(c => c.codigoPais === this.paisSeleccionado?.codigo && c.nombre === this.ciudadSeleccionada?.nombre)){
        selec = true;
      }else{
        selec = false;
      }
      return {
        id: lista.idLista,
        nombre: lista.nombreLista,
        seleccionada: selec
      };
    });
  }
  private pasajeFrontaDB(){
    this.listasFront.forEach(l => {
      let listaOriginal = this.listasFavoritosDB.find(ldb => ldb.idLista === l.id);
      if(listaOriginal === undefined){ // si es una lista nueva
        listaOriginal = { //la agrega
          idLista:l.id,
          nombreLista:l.nombre,
          listaCiudades:[]
        }
        this.listasFavoritosDB.push(listaOriginal);
      }
      //veo si
      //la ciudad esta en la lista original y en la front o si no esta en la original y no esta en la front
      if(listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && l.seleccionada ||
        !listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && !l.seleccionada){
          ///la lista se mantiene sin cambios
          console.log("la lista se mantiene");
      }else if(l.seleccionada){
        //se agrega la ciudad
        console.log("agrega");
          listaOriginal.listaCiudades.push({codigoPais:this.paisSeleccionado.codigo,nombre:this.ciudadSeleccionada.nombre});
      }else{
        //se quita la ciudad
          console.log("saca");
          listaOriginal.listaCiudades = listaOriginal.listaCiudades.filter(elementoFav => !(elementoFav.codigoPais === this.paisSeleccionado.codigo && elementoFav.nombre === this.ciudadSeleccionada.nombre));

      }
    });

  }
  pasarFormularioAListaFront() {
    this.listasFront = this.arrayCheckbox.value;

  }
  pasajeListaFrontAFormulario(){
    this.formulario.setControl('checkboxesListasFavoritos',this.fb.array(this.listasFront.map(l => this.crearCheckboxForm(l))))
  }
  saveSelection() {
    this.pasarFormularioAListaFront();
    this.pasajeFrontaDB();


    this.visible = false;
  }

  closePopup() {

    this.nuevaListaInput.reset();
    this.pasajeListaFrontAFormulario();
    console.log("se cierra");
    this.visible = false;
  }
  ngOnDestroy(){
    this.ids.id$.subscribe(
      {
        next:(id) => {
          if(id){
            this.us.getUsuarioById(id).subscribe(
              {
                next:(u) => {
                  if(u){
                    u.listasFavs = this.listasFavoritosDB;
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

}
