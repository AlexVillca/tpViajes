import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ErrorDatoEnUso, UsuariosService } from '../../service/usuarios.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Usuario } from '../../../models/interface/usuario.interface'

/**
 * Formulario de registro de una cuenta nueva. La unicidad del usuario y el email la valida el backend
 * (responde 409) y acá se muestra el error en el campo que corresponde.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule, TranslatePipe],
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  routerService = inject(Router);
  usuarioService = inject(UsuariosService);
  registroExitoso = false;
  fb = inject(FormBuilder)
  formulario = this.fb.nonNullable.group({
    username:["",[Validators.required,Validators.minLength(4),Validators.maxLength(20),Validators.pattern(/^[^@]+$/)]],
    email:["",[Validators.required,Validators.email]],
    password:["",[Validators.required,Validators.minLength(8),Validators.maxLength(20)]],

  });
  user:Usuario = {
    username: '',
    email: '',
    password: '',
    listasFavs:
    [
      {
        idLista:Math.random().toString(36).substring(2, 9),
        nombreLista:"Guardadas",
        listaCiudades:[]
      }]
  };

  emailInvalid:Boolean = false;
  userNameInvalid:Boolean = false;
  serverError = '';

  onSubmit() {
    this.emailInvalid = false;
    this.userNameInvalid = false;
    this.serverError = '';
    if (this.formulario.invalid) { return; }

    this.user.username = this.formulario.get('username')?.value || "";
    this.user.email = this.formulario.get('email')?.value || "";
    this.user.password = this.formulario.get('password')?.value || "";

    // El backend valida la unicidad del usuario y el email; ante un dato repetido devuelve 409.
    this.usuarioService.postUsuario({ ...this.user }).subscribe({
      next: () => {
        this.registroExitoso = true;
        setTimeout(() => {
          this.routerService.navigate(['login']);
        }, 4000);
      },
      error: (error) => {
        if (error instanceof ErrorDatoEnUso) {
          if (error.campo === 'email') {
            this.emailInvalid = true;
          } else {
            this.userNameInvalid = true;
          }
        } else {
          this.serverError = error.message;
        }
      }
    });
  }

}
