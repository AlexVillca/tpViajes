import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Usuario } from '../../../models/interface/usuario.interface'

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
    if (this.formulario.invalid) {return}
    this.user.username = this.formulario.get('username')?.value || "";
    this.user.email = this.formulario.get('email')?.value || "";
    this.user.password = this.formulario.get('password')?.value || "";
    this.usuarioService.comprobarEmailUsuario(this.user.email).subscribe(
      {
      next: (emailDisponible) => {
        if (emailDisponible) {
          this.emailInvalid = false;
          this.usuarioService.comprobarUserNameUsuario(this.user.username).subscribe(
            {
              next: (usernameDisponible) => {
                if(usernameDisponible){
                  this.userNameInvalid = false;

                  this.usuarioService.postUsuario({...this.user})
                  .subscribe(
                    {
                    next: () => {
                      this.registroExitoso = true;

                      setTimeout(() => {
                        this.routerService.navigate(['login']);
                      }, 4000);
                     },
                    error: (error) => {
                      this.serverError = error.message;
                    }
                    }
                  );

                }else{
                  this.userNameInvalid = true;
                }
              },
            error: (error) => {
              this.serverError = error.message;
            }
            }
          );
        } else {
          this.emailInvalid = true;

        }
      },
      error: (error) => {
        this.serverError = error.message;
      }
      }
    );
  }

}
