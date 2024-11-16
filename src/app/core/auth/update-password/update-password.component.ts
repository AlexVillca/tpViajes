import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../service/usuarios.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.css']
})
export class UpdatePasswordComponent implements OnInit {
  id: string | null = null;

  fb = inject(FormBuilder);
  usuariosService = inject(UsuariosService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  formularioUpdate = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe({
      next: (param) => {
        this.id = param.get('id');
        if (!this.id) {
          console.error('No se recibió el ID del usuario');
        }
      },
      error: (e) => console.error(e),
    });
  }

  update(): void {
    if (this.formularioUpdate.invalid) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const { password, confirmPassword } = this.formularioUpdate.getRawValue();

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden. Por favor, inténtalo de nuevo.');
      return;
    }

    if (!this.id) {
      console.error('No se recibió el ID del usuario');
      return;
    }

    this.usuariosService.cambiarContrasena(this.id, password).subscribe({
      next: () => {
        alert('La contraseña ha sido actualizada con éxito');
        this.router.navigateByUrl('home'); // Redirige a la página de inicio
      },
      error: (e) => {
        console.error('Error al actualizar la contraseña:', e.message);
        alert('Ocurrió un error al actualizar la contraseña');
      },
    });
  }
}
