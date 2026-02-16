import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { PopUpConfirmarComponent } from '../../../utils/pop-up-confirmar/pop-up-confirmar.component';
import { UsuariosService } from '../../../../core/service/usuarios.service';


@Component({
  selector: 'app-titulo-lista',
  standalone: true,
  imports: [FormsModule, NgIf,PopUpConfirmarComponent],
  templateUrl: './titulo-lista.component.html',
  styleUrl: './titulo-lista.component.css'
})
export class TituloListaComponent{

  @Output() eliminarLista = new EventEmitter<void>();
  @Output() nuevoTitulo = new EventEmitter<string>();
  @Input() nombreOriginal = "";
  @Input() idUser = "";
  usuarioService = inject(UsuariosService);

  tituloInput = "";

  editarTitulo:boolean = false;

  cambiarEditarTitulo():void{
    if(!this.editarTitulo) this.tituloInput = this.nombreOriginal;
    this.editarTitulo = !this.editarTitulo;
  }

  cancelarNuevoTitulo():void{
    this.tituloInput = this.nombreOriginal;
    this.cambiarEditarTitulo();
  }

  mostrarPopUp:boolean = false;

  textoPopUp():string{
    return "Desea eliminar la lista " + this.nombreOriginal + "?";
  }

  guardarNuevoTitulo():void{
    this.tituloInput = this.tituloInput.trim();
    if(this.tituloInput === "" || this.tituloInput === this.nombreOriginal){
      this.cancelarNuevoTitulo();
      return;
    }

    this.usuarioService.comprobarNombreExistenteDeLista(this.idUser,this.tituloInput).subscribe(
      {
       next: (response:boolean) => {
            if(response){
              this.mostrarErrorTemporal();
            }else{
              this.nombreOriginal = this.tituloInput;
              this.cambiarEditarTitulo();
              this.nuevoTitulo.emit(this.tituloInput);
            }
        },
        error:(error) => {console.log(error)}
      });

  }


  private errorTimeout: any;
  mensajeNombreRepetido:boolean = false;

  mostrarErrorTemporal() {
    this.mensajeNombreRepetido= true;

    this.errorTimeout = setTimeout(() => {
      this.mensajeNombreRepetido = false;
    }, 3000);
  }

  onTituloChange() {
    if (this.mensajeNombreRepetido) {
      this.mensajeNombreRepetido= false;
    }

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

}
