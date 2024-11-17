import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';


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
  idUsuarioService = inject(IdUsuarioService);
  location = inject(Location);

  formularioUpdate = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]]
  });

  locationService: any;

  ngOnInit(): void {
    this.idUsuarioService.id$.subscribe({
      next: (id) => {
        this.id = id;
        if (!this.id) {
          console.error('No se recibió el ID del usuario logueado');
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
      console.error('No se recibió el ID del usuario logueado');
      return;
    }

    this.usuariosService.cambiarContrasena(this.id, password).subscribe({
      next: () => {
        alert('La contraseña ha sido actualizada con éxito');
        this.router.navigateByUrl('home');
      },
      error: (e) => {
        console.error('Error al actualizar la contraseña:', e.message);
        alert('Ocurrió un error al actualizar la contraseña');
      },
    });
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

  volver(): void {
    this.location.back();
  }
}
