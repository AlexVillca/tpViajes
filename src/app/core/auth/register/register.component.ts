import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Usuario } from '../../../models/interface/usuario.interface'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule,CommonModule,RouterModule], // Asegúrate de importar los módulos necesarios aquí
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild('registerForm') registerForm!: NgForm;
  routerService = inject(Router);
  usuarioService = inject(UsuariosService);
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
      }
    ]
  };
  emailInvalid:Boolean = false;
  userNameInvalid:Boolean = false;

  /*
  this.usuarioService.postUsuario(this.user).subscribe({
              next: (response) => {
                console.log('Usuario creado exitosamente:', response);
              },
              error: (error) => {
                console.error('Error al crear usuario:', error);
              }
            });
  */




  onSubmit() {

    if (this.registerForm.valid) {

      this.usuarioService.comprobarEmailUsuario(this.user.email).subscribe(
        {
        next: (emailDisponible) => {
          if (emailDisponible) {
            this.emailInvalid = false;
            this.usuarioService.comprobarUserNameUsuario(this.user.username).subscribe(
              {
                next: (usernameDisponible) => {
                  if(usernameDisponible){
                    console.log("username aceptado");
                    this.userNameInvalid = false;

                    this.usuarioService.postUsuario(this.user)
                    .subscribe(
                      {
                      next: (response) => {
                        console.log('Usuario creado exitosamente:', response);
                        this.routerService.navigate(['login']);
                       },
                      error: (error) => { console.error('Error al crear usuario:', error); }
                      }
                    );

                  }else{
                    console.error('El username esta en uso');
                    this.userNameInvalid = true;
                  }
                },
              error: (error) => {
                console.error('Error al comprobar el username:', error);
              }
              }
            );
          } else {
            console.log('El email ya está en uso.');
            this.emailInvalid = true;

          }
        },
        error: (error) => { console.error('Error al comprobar el email:', error); }
        }
      );
    }
  }



}
