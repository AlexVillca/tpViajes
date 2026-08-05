import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { Ciudad, Pais } from '../../../models/interface/pais.interface';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { valorExistenteMap } from '../../../validators/valorExistenteMap.validator';
import { maxItemsValidator } from '../../../validators/maxItems.validator';
import { FeedbackService } from '../../../core/service/feedback.service';




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

  ciudadSeleccionada: Ciudad | null = null;
  paisSeleccionado: Pais | null = null;

  alertaMaxListas = false;
  alertaNombreRepetido = false;
  feedback = inject(FeedbackService);
  // Evita abrir o guardar mientras falta el contexto minimo de usuario/pais/ciudad/listas.
  contextoListo = false;
  errorCargaContexto = '';

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

  private marcarContextoNoDisponible(mensaje = 'No se pudieron cargar tus listas de favoritos.'): void {
    this.contextoListo = false;
    this.errorCargaContexto = mensaje;
  }



  ngOnInit(): void {

    this.ids.id$.subscribe(
      {
        next: (id) => {
          if(!id){
            this.logueado = false;
            this.marcarContextoNoDisponible('Debes iniciar sesión para guardar favoritos.');
            return;
          }

          this.logueado = true;
          this.paisDataService.pais$.subscribe(
            {
              next:(p) => {
                if (!p) {
                  this.marcarContextoNoDisponible('No se pudo obtener el país seleccionado.');
                  return;
                }

                this.paisSeleccionado = p
                this.ciudadDataService.ciudad$.subscribe(
                  {
                    next:(c) => {
                      if (!c) {
                        this.marcarContextoNoDisponible('No se pudo obtener la ciudad seleccionada.');
                        return;
                      }

                      this.ciudadSeleccionada = c
                      this.us.obtenerListasFav(id).subscribe(
                        {
                          next:(l) => {
                            // Actualizamos el formulario solo cuando ya existe el contexto completo.
                            this.listasFavoritosDB = l;
                            this.pasajeDBaFormulario();
                            this.contextoListo = true;
                            this.errorCargaContexto = '';

                          },
                          error: (e) => {
                            this.marcarContextoNoDisponible(e.message);
                          }
                        }
                    )

                    },
                    error:(error) => {
                      this.marcarContextoNoDisponible(error.message);
                    }
                  }
                );

              },
              error:(error) => {
                this.marcarContextoNoDisponible(error.message);
              }
            }
          );
        },
        error: (e) => {
          this.marcarContextoNoDisponible(e.message);
        }
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
    this.nuevaListaInput.markAsTouched();
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
    // Narrowing: si falta pais o ciudad no hay nada que sincronizar.
    const pais = this.paisSeleccionado;
    const ciudad = this.ciudadSeleccionada;
    if (!pais || !ciudad) { return; }
    const codigoPais = pais.codigo ?? '';

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
        c.codigoPais === codigoPais &&
        c.nombre === ciudad.nombre
      );

      if(ciudadSeleccionadaFormulario && !ciudadExisteEnLista){
        listaOriginal.listaCiudades.push({
          codigoPais: codigoPais,
          nombre: ciudad.nombre
        });
      }

      if(!ciudadSeleccionadaFormulario && ciudadExisteEnLista){
        listaOriginal.listaCiudades = listaOriginal.listaCiudades.filter(c =>
          !(c.codigoPais === pais.codigo &&
            c.nombre === ciudad.nombre)
        );
      }
    });
  }

  saveSelection() {
    // Sin pais o ciudad seleccionada, pasajeFormularioaDB puede romper por acceso a propiedades null.
    if (!this.contextoListo || !this.paisSeleccionado || !this.ciudadSeleccionada) {
      this.feedback.error(this.errorCargaContexto || 'No se pudieron guardar los favoritos.');
      return;
    }

    this.pasajeFormularioaDB();
    this.ids.id$.subscribe(
      {
        next:(id) => {
         if(id){
          this.us.actualizarListasFavoritos(id,this.listasFavoritosDB).subscribe(
            {
              next:() => {
                this.cierraPopUp();
                this.feedback.success('Lista guardada.');
              },
              error:(error) => {
                this.feedback.error(error.message);
              }
            });
          } else {
            this.feedback.error('No se pudo obtener el usuario actual.');
          }
        },
        error:() => {
          this.feedback.error('No se pudo obtener el usuario actual.');
        }
      }
    );

  }
  cierraPopUp(){
    document.body.style.overflow = "auto";
    this.nuevaListaInput.reset();
    this.visible = false;
  }
  abrePopUp(){
    if (!this.contextoListo) {
      this.feedback.error(this.errorCargaContexto || 'No se pudieron cargar tus listas de favoritos.');
      return;
    }

    document.body.style.overflow = "hidden";
    this.visible=true;
  }
  cancelar() {
    this.cierraPopUp();
    this.pasajeDBaFormulario();

  }


}
