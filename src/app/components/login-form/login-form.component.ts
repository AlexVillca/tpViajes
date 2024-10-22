import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  isRegistering: boolean = false; // Estado para controlar si se muestra el registro

  // Método para cambiar a la vista de registro
  switchToRegister() {
    this.isRegistering = true;
  }

  // Método para cambiar a la vista de inicio de sesión
  switchToLogin() {
    this.isRegistering = false;
  }
  
}
