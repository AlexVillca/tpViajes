import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './update-password.component.html'
})
export class UpdatePasswordComponent implements OnInit {

  id: string | null = null;

  fb = inject(FormBuilder);
  usuariosService = inject(UsuariosService);
  router = inject(Router);
  idUsuarioService = inject(IdUsuarioService);
  location = inject(Location);

  formularioUpdate: FormGroup = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    confirmPassword: ['', [Validators.required]]
  });

  serverError = '';
  successMessage = '';

  /** La nueva contraseña y su confirmación no coinciden (solo si ya se escribió la confirmación). */
  get passwordNotMatch(): boolean {
    const { password, confirmPassword } = this.formularioUpdate.getRawValue();
    return !!confirmPassword && password !== confirmPassword;
  }

  ngOnInit(): void {
    this.idUsuarioService.id$.subscribe({
      next: (id) => {
        this.id = id;
        if (!this.id) {
          console.error('No se recibio el ID del usuario logueado');
        }
      },
      error: (e) => console.error(e),
    });
  }

  update(): void {
    this.serverError = '';
    this.successMessage = '';

    if (!this.id) { return; }
    if (this.formularioUpdate.invalid || this.passwordNotMatch) { return; }

    const { password, currentPassword } = this.formularioUpdate.getRawValue();
    this.usuariosService.cambiarContrasena(this.id, password, currentPassword).subscribe({
      next: () => {
        this.successMessage = 'mensajes.contrasenaActualizada';
        setTimeout(() => {
          this.router.navigateByUrl('home');
        }, 1500);
      },
      error: (e) => {
        this.serverError = e.message;
      },
    });
  }

  volver(): void {
    this.router.navigateByUrl('/fichaUser');
  }
}
