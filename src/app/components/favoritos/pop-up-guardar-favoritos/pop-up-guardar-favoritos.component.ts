import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { valorExistenteMap } from '../../../validators/valorExistenteMap.validator';
import { maxItemsValidator } from '../../../validators/maxItems.validator';




@Component({
  selector: 'app-pop-up-guardar-favoritos',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './pop-up-guardar-favoritos.component.html',
  styleUrl: './pop-up-guardar-favoritos.component.css'
})
export class PopUpGuardarFavoritosComponent implements OnInit{

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

  alertaMaxListas = false;
  alertaNombreRepetido = false;

  formulario:FormGroup = this.fb.group({
    nuevocheckboxListaFavorito: ['', [Validators.required,valorExistenteMap(this.mapNombresListas),maxItemsValidator(this.mapNombresListas,6)]],
    checkboxesListasFavoritos: this.fb.group({})
  });


  get groupCheckbox(): FormGroup {
    return this.formulario.get('checkboxesListasFavoritos') as FormGroup;
  }
  get idsGroupCheckbox(){
    return Object.keys( this.groupCheckbox.value || {});
  }

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
 agregarNuevaLista(){
  if(!this.nuevaListaInput.valid){
    return;
  }
  let nuevoId = this.nuevoIdLista();
  this.mapNombresListas.set(nuevoId,this.nuevaListaInput.value);
  this.groupCheckbox.addControl(nuevoId,new FormControl(true));
  this.nuevaListaInput.reset();
 }



  private pasajeDBaFormulario(){
    const groupAux = this.fb.group({});
    this.mapNombresListas.clear();
    this.listasFavoritosDB.forEach(lista => {
      let selec = lista.listaCiudades.some(c => c.codigoPais === this.paisSeleccionado?.codigo && c.nombre === this.ciudadSeleccionada?.nombre);
      this.mapNombresListas.set(lista.idLista,lista.nombreLista);
      groupAux.addControl(lista.idLista,new FormControl(selec));
    });

    this.formulario.setControl('checkboxesListasFavoritos',groupAux);
  }



  private pasajeFormularioaDB(){

    Object.entries(this.groupCheckbox.controls).forEach(([id, control]) => {

      const ciudadSeleccionadaFormulario = control.value;

      let listaOriginal = this.listasFavoritosDB.find(ldb => ldb.idLista === id);

      if(listaOriginal === undefined){
        listaOriginal = {
          idLista:id,
          nombreLista:this.mapNombresListas.get(id) || "error",
          listaCiudades:[]
        }
        this.listasFavoritosDB.push(listaOriginal);
      }

      const ciudadExisteEnLista = listaOriginal.listaCiudades.some(c =>
        c.codigoPais === this.paisSeleccionado.codigo &&
        c.nombre === this.ciudadSeleccionada.nombre
      );

      if(ciudadSeleccionadaFormulario && !ciudadExisteEnLista){
        listaOriginal.listaCiudades.push({
          codigoPais: this.paisSeleccionado.codigo,
          nombre: this.ciudadSeleccionada.nombre
        });
      }

      if(!ciudadSeleccionadaFormulario && ciudadExisteEnLista){
        listaOriginal.listaCiudades = listaOriginal.listaCiudades.filter(c =>
          !(c.codigoPais === this.paisSeleccionado.codigo &&
            c.nombre === this.ciudadSeleccionada.nombre)
        );
      }
    });
  }

  saveSelection() {
    this.pasajeFormularioaDB();
    this.ids.id$.subscribe(
      {
        next:(id) => {
         if(id){
          this.us.actualizarListasFavoritos(id,this.listasFavoritosDB).subscribe(
            {
              next:() => {
                this.cierraPopUp();
              },
              error:() => {console.log("No se pudo actualizar usuario");}
            });
          }
        },
        error:() => {console.log("ERROR:no se pudo obtener el id");}
      }
    );

  }
  cierraPopUp(){
    document.body.style.overflow = "auto";
    this.nuevaListaInput.reset();
    this.visible = false;
  }
  abrePopUp(){
    document.body.style.overflow = "hidden";
    this.visible=true;
  }
  cancelar() {
    this.cierraPopUp();
    this.pasajeDBaFormulario();

  }


}
