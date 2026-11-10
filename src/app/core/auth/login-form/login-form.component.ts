import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule, TranslatePipe],
  templateUrl: './login-form.component.html'
})
export class LoginFormComponent {
  usuarioService = inject(UsuariosService);
  routerService = inject(Router);
  route = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  formulario = this.fb.nonNullable.group({
    usuario: ['',[Validators.required]],
    password: ['',[Validators.required]]
  })

  usuarioIncorrecto = false;
  passwordIncorrecto = false;
  serverError = '';
  loguearse(){
    this.usuarioIncorrecto = false;
    this.passwordIncorrecto =false;
    this.serverError = '';
    if(this.formulario.invalid){
      this.formulario.markAllAsTouched();
      return;
    }
    this.usuarioService.login(this.formulario.get("usuario")?.value ?? "", this.formulario.get("password")?.value ?? "").subscribe(
      {
        next:(value)=>{
          if(value === null){
            this.usuarioIncorrecto = true;

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

}

