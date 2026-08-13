import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  usuarioService = inject(UsuariosService);
  routerService = inject(Router);
  route = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  formulario = this.fb.nonNullable.group({
    email: ['',[Validators.required, Validators.email]],
    password: ['',[Validators.required]]
  })

  emailIncorrecto = false;
  passwordIncorrecto = false;
  serverError = '';
  loguearse(){
    this.emailIncorrecto = false;
    this.passwordIncorrecto =false;
    this.serverError = '';
    if(this.formulario.invalid){
      this.formulario.markAllAsTouched();
      return;
    }
    this.usuarioService.login(this.formulario.get("email")?.value ?? "", this.formulario.get("password")?.value ?? "").subscribe(
      {
        next:(value)=>{
          if(value === null){
            this.emailIncorrecto = true;

          }else{
            if(value){
              const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
              this.routerService.navigateByUrl(returnUrl || '/home');

            }else{
              this.passwordIncorrecto = true;

            }
          }
        },
        error:(e)=>{
          this.serverError = e.message;
        }
      }
  )
  }

  videoLoaded = false;

  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');
      });
    }, 200);
  }

  containerVisible = false;

  ngOnInit() {
    setTimeout(() => {
      this.containerVisible = true;
    }, 200);
  }

}

