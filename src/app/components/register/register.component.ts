import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Usuario } from '../../interface/usuario.interface'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule,CommonModule,RouterModule], // Asegúrate de importar los módulos necesarios aquí
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild('registerForm') registerForm!: NgForm;

 usuarioService = inject(UsuariosService);
  user:Usuario = {
    username: '',
    email: '',
    password: ''
  };

  onSubmit() {
    if (this.registerForm.valid) {
      // Lógica para enviar los datos del formulario (this.user) al servidor
       this.usuarioService.postUsuario(this.user).subscribe({
        next: (response) => {
          console.log('Usuario creado exitosamente:', response);

        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
        }
      });

    }
  }
}
