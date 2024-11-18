import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { RegisterComponent } from '../../../core/auth/register/register.component';
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

  listaDeListasDB:ListaFav[] = [];
  listasFront:ListaCheckbox[] = [];




  ciudadSeleccionada:any;
  paisSeleccionado:any;

  alertaMax = false;

  formulario:any;

  constructor(){



  }

  createItemControl(item: any): FormGroup {
    return this.fb.group({
      id: [item.id],
      nombre: [item.nombre],
      seleccionada: [item.seleccionada]
    });
  }

  get itemsArray(): FormArray {
    return this.formulario.get('items') as FormArray;
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
                    this.listaDeListasDB = l
                    this.listasFront = this.listaDeListasDB.map(lista => this.mapDBaFront(lista));
                    this.formulario = this.fb.group({
                      nuevoItem: ['', Validators.required],
                      items: this.fb.array(this.listasFront.map(item => this.createItemControl(item)))
                      //
                    });


                  },
                  error: (e) => {console.log(e)}
                }
            )
          }
        },
        error: (e) => {console.log(e)}
      }
    );

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

 // Agrega un nuevo item al FormArray
 agregarNuevaLista() {

  if(this.itemsArray.length < 6){
    console.log("entro cant listas");
    console.log(this.formulario.value);

    if (this.formulario.get('nuevoItem')?.valid) {
      console.log("entro form valido");
    const nuevoItem = {
      id: Math.random().toString(36).substring(2, 9),
      nombre: this.formulario.get('nuevoItem')?.value,
      seleccionada: true
    };
    this.itemsArray.push(this.createItemControl(nuevoItem));
    this.formulario.get('nuevoItem')?.reset();
    }else{

    }
  }else{
    this.alertaMax = true;

    setTimeout(() => {
      this.alertaMax = false;
    }, 4000);
  }
}




  private mapDBaFront(lista: ListaFav):ListaCheckbox{
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
 pasarFormaListaFront() {


    this.listasFront = this.formulario.value.items;
    console.log(this.listasFront);
  }
  saveSelection() {
    this.pasarFormaListaFront();
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

    this.visible = false;
  }

  closePopup() {
    this.formulario = this.fb.group({
      nuevoItem: ['', Validators.required],
      items: this.fb.array(this.listasFront.map(item => this.createItemControl(item)))

    });
    console.log("se cierra");
    this.visible = false;
  }

}
