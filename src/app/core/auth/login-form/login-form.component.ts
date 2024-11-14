
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { IdUsuarioService } from '../../service/id-usuario.service';
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
  idUsuario = inject(IdUsuarioService);
  routerService = inject(Router);
  fb = inject(FormBuilder);

  formulario = this.fb.nonNullable.group({
    email: ['',[Validators.required]],
    password: ['',[Validators.required]]
  })


  funRespuesta() {

    const correoInput = this.formulario.get('email')!.value;
    const contrInput = this.formulario.get('password')!.value;

    this.usuarioService.logUsuario(correoInput, contrInput).subscribe({
      next: (id) => {
        if (id) {
          this.idUsuario.setId(id);
          this.routerService.navigate(['home']);
        } else {
          console.log("usuario no registrado funResp");
        }
      },
      error: (error) => {
        console.error('Error al loguear:', error);
      }
    });
  }


  }



