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
export class SelecionadorListasFlotanteComponent implements OnInit{

  fb = inject(FormBuilder);
  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);
  paisDataService = inject (PaisDataService);
  ciudadDataService = inject(CiudadDataService);

  visible = false;
  logueado = false;

  listasFavoritosDB:ListaFav[] = [];
  mapNombresListas = new Map<string,string>();

  ciudadSeleccionada:any;
  paisSeleccionado:any;

  alertaMax = false;

  formulario:FormGroup = this.fb.group({
    nuevocheckboxListaFavorito: ['', Validators.required],
    checkboxesListasFavoritos: this.fb.group({})
  });

  //con esto trabajo directamente en los checkbox
  get groupCheckbox(): FormGroup {
    return this.formulario.get('checkboxesListasFavoritos') as FormGroup;
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
            this.paisDataService.pais$.subscribe(
              {
                next:(p) => {
                  this.paisSeleccionado = p
                  this.ciudadDataService.ciudad$.subscribe(
                    {
                      next:(c) => {
                        this.ciudadSeleccionada = c
                        this.us.obtenerListasFav(id).subscribe(
                          {
                            next:(l) => {
                              //obtengo las listas
                              this.listasFavoritosDB = l;
                              //cargo las checkbox
                              this.pasajeDBaFormulario();
                              console.log(Object.entries(this.groupCheckbox.controls));
                            },
                            error: (e) => {console.log(e)}
                          }
                      )


                      },
                      error:(error) => {console.log(error)}
                    }
                  );

                },
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
    }while(Object.keys(this.groupCheckbox.controls).some( (l:string)=> l === idGenerado));
    return idGenerado;
  }

 // Agrega un nuevo item al FormArray
 agregarNuevaLista() {

  if(Object.keys(this.groupCheckbox.controls).length < 6){
    console.log("entro cant listas");
    if (this.nuevaListaInput.valid) {
      console.log("entro form valido");
      let nuevoId = this.nuevoIdLista();
      this.mapNombresListas.set(nuevoId,this.nuevaListaInput.value);
      this.groupCheckbox.addControl(nuevoId,new FormControl(true));
      this.nuevaListaInput.reset();
    }
  }else{
    this.alertaMax = true;

    setTimeout(() => {
      this.alertaMax = false;
    }, 4000);
  }
 }
  private pasajeDBaFormulario(){
    const groupAux = this.fb.group({});
    this.mapNombresListas.clear();
    this.listasFavoritosDB.forEach(lista => {
      let selec;
      if(lista.listaCiudades.some(c => c.codigoPais === this.paisSeleccionado?.codigo && c.nombre === this.ciudadSeleccionada?.nombre)){
        selec = true;
      }else{
        selec = false;
      }
      this.mapNombresListas.set(lista.idLista,lista.nombreLista);
      console.log(lista.nombreLista + " " + lista.idLista + " tiene esta ciudad en su lista? " + selec);
      groupAux.addControl(lista.idLista,new FormControl(selec));
    });
    console.log(Object.entries(groupAux.controls));
    this.formulario.setControl('checkboxesListasFavoritos',groupAux);
  }



  private pasajeFormularioaDB(){

    Object.entries(this.groupCheckbox.controls).forEach(([id, control]) => {
      const seleccionado = control.value;
      let listaOriginal = this.listasFavoritosDB.find(ldb => ldb.idLista === id);

      if(listaOriginal === undefined){ // si es una lista nueva
        listaOriginal = { //la agrega
          idLista:id,
          nombreLista:this.mapNombresListas.get(id) || "problema",
          listaCiudades:[]
        }
        this.listasFavoritosDB.push(listaOriginal);
      }
      //veo si
      //la ciudad esta en la lista original y en la front o si no esta en la original y no esta en la front
      if(listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && seleccionado ||
        !listaOriginal.listaCiudades.some(cl => cl.codigoPais === this.paisSeleccionado.codigo && cl.nombre === this.ciudadSeleccionada.nombre) && !seleccionado){
          ///la lista se mantiene sin cambios
          console.log("la lista se mantiene");
      }else if(seleccionado){
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

  saveSelection() {
    this.pasajeFormularioaDB();
    this.ids.id$.subscribe(
      {
        next:(id) => {
          if(id){
            this.us.getUsuarioById(id).subscribe(
              {
                next:(u) => {
                  if(u){

                    console.log(this.listasFavoritosDB);
                    u.listasFavs = this.listasFavoritosDB;

                    this.us.actualizarUsuario(u).subscribe(
                      {
                        next:() => {console.log("lista favs actualizada")
                          console.log(this.listasFavoritosDB);
                          this.nuevaListaInput.reset();
                          this.visible = false;
                        },
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

  cancelar() {
    this.nuevaListaInput.reset();
    this.pasajeDBaFormulario();
    console.log("se cancela");
    this.visible = false;
  }


}
