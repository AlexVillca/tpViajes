
import { CommonModule, provideNetlifyLoader } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { IdUsuarioService } from '../../service/id-usuario.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule,CommonModule,RouterModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  usuarioService = inject(UsuariosService);
  idUsuario = inject(IdUsuarioService);



  isRegistering: boolean = false; // Estado para controlar si se muestra el registro


  correoInput: string= '';
  contrInput: string = '';
   setCorreo(event:any){
    console.log("se actualizao");
      this.correoInput = event.target.value;
   }
   setContr(event:any){
    this.contrInput = event.target.value;
   }

  funRespuesta(){
    this.usuarioService.logUsuario(this.correoInput, this.contrInput).subscribe(id => {
      if(id){
        this.idUsuario.setId(id);
      }else{
        console.log("usuario no registrado funResp");
      }
    } );

  }

  switchToRegister() {
    this.isRegistering = true;
  }
  // Método para cambiar a la vista de inicio de sesión
  switchToLogin() {
    this.isRegistering = false;
  }

  }



