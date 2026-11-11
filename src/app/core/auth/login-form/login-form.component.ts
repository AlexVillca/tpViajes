import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Formulario de inicio de sesión. Ante credenciales inválidas muestra un mensaje genérico (no revela
 * si la cuenta existe) y, al entrar, respeta el returnUrl para volver a donde se quería ir.
 */
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

  credencialesInvalidas = false;
  serverError = '';
  loguearse(){
    this.credencialesInvalidas = false;
    this.serverError = '';
    if(this.formulario.invalid){
      this.formulario.markAllAsTouched();
      return;
    }
    this.usuarioService.login(this.formulario.get("usuario")?.value ?? "", this.formulario.get("password")?.value ?? "").subscribe(
      {
        next:(ok)=>{
          if(ok){
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            this.routerService.navigateByUrl(returnUrl || '/home');
          }else{
            this.credencialesInvalidas = true;
          }
        },
        error:(e)=>{
          this.serverError = e.message;
        }
      }
  )
  }

}

