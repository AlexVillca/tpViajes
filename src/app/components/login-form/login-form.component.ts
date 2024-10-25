import { CommonModule, provideNetlifyLoader } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule,CommonModule,RouterModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  isRegistering: boolean = false; // Estado para controlar si se muestra el registro
  correoInput: string= '';
  contrInput: string = '';
   setCorreo(event:any){
      this.correoInput = event.target.value;
   }
   setContr(event:any){
    this.contrInput = event.target.value;
   }
   // Método para cambiar a la vista de registro
  switchToRegister() {
    this.isRegistering = true;
  }



  // Método para cambiar a la vista de inicio de sesión
  switchToLogin() {
    this.isRegistering = false;
  }
  funRespuesta(){
    alert(this.correoInput +  ' ' + this.contrInput
    )
  }


}
