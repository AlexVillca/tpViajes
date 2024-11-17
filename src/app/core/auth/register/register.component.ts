import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Usuario } from '../../../models/interface/usuario.interface'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  routerService = inject(Router);
  usuarioService = inject(UsuariosService);
  registroExitoso = false;
  fb = inject(FormBuilder)
  formulario = this.fb.nonNullable.group({
    username:["",[Validators.required,Validators.minLength(4),Validators.maxLength(20)]],
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





  onSubmit() {
    this.emailInvalid = false;
    this.userNameInvalid = false;
    if (this.formulario.invalid) {return}
    this.user.username = this.formulario.get('username')?.value || "";
    this.user.email = this.formulario.get('email')?.value || "";
    this.user.password = this.formulario.get('password')?.value || "";
    this.usuarioService.comprobarEmailUsuario(this.user.email).subscribe(
      {
      next: (emailDisponible) => {
        if (emailDisponible) {
          console.log("email disponible");
          this.emailInvalid = false;
          this.usuarioService.comprobarUserNameUsuario(this.user.username).subscribe(
            {
              next: (usernameDisponible) => {
                if(usernameDisponible){
                  console.log("username aceptado");
                  this.userNameInvalid = false;

                  this.usuarioService.postUsuario({...this.user})
                  .subscribe(
                    {
                    next: (response) => {
                      console.log(response);
                      this.registroExitoso = true;

                      setTimeout(() => {
                        this.routerService.navigate(['login']);
                      }, 4000);
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


  videoLoaded = false;
  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');  // Añadir la clase 'visible' a los botones
      });
    }, 200);  // Se espera 200ms para asegurarse de que todo se renderice correctamente
  }

  containerVisible = false;

  ngOnInit() {
    // Activa la clase después de un breve retraso
    setTimeout(() => {
      this.containerVisible = true;
    }, 200); // Retraso en milisegundos
  }

}
