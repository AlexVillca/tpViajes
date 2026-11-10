import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { ErrorDatoEnUso, UsuariosService } from '../../service/usuarios.service';
import { FeedbackService } from '../../service/feedback.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './editar-perfil.component.html'
})
export class EditarPerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly idUsuario = inject(IdUsuarioService);
  private readonly usuarios = inject(UsuariosService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);

  formulario = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[^@]+$/)]],
    email: ['', [Validators.required, Validators.email]]
  });

  guardando = false;
  campoEnUso: 'username' | 'email' | null = null;
  errorServidor = '';

  ngOnInit(): void {
    const sesion = this.idUsuario.currentSession;
    this.formulario.setValue({ username: sesion?.username ?? '', email: sesion?.email ?? '' });
  }

  get sinCambios(): boolean {
    const sesion = this.idUsuario.currentSession;
    const { username, email } = this.formulario.getRawValue();
    return username.trim() === (sesion?.username ?? '') && email.trim() === (sesion?.email ?? '');
  }

  guardar(): void {
    this.campoEnUso = null;
    this.errorServidor = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.sinCambios) {
      this.volver();
      return;
    }

    const sesion = this.idUsuario.currentSession;
    const { username, email } = this.formulario.getRawValue();
    const cambios: { username?: string; email?: string } = {};
    if (username.trim() !== sesion?.username) cambios.username = username.trim();
    if (email.trim() !== sesion?.email) cambios.email = email.trim();

    this.guardando = true;
    this.usuarios.actualizarPerfil(cambios).subscribe({
      next: () => {
        this.guardando = false;
        this.feedback.success('mensajes.perfilActualizado');
        this.volver();
      },
      error: (error: Error) => {
        this.guardando = false;
        if (error instanceof ErrorDatoEnUso) {
          this.campoEnUso = error.campo;
        } else {
          this.errorServidor = error.message;
        }
      }
    });
  }

  volver(): void {
    this.router.navigateByUrl('/fichaUser');
  }
}
