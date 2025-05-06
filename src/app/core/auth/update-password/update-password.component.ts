import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../service/usuarios.service';
import { Router } from '@angular/router';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';


@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,FormsModule],
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

  formularioUpdate:FormGroup = this.fb.nonNullable.group({
    password: ['',[Validators.required,Validators.minLength(8),Validators.maxLength(20)]],
    confirmPassword: ['', [Validators.required]]
  });

  locationService: any;
  containerVisible = false;
  checkPasswordMatch():void{
    const { password, confirmPassword } = this.formularioUpdate.getRawValue();
    if (password !== confirmPassword) {
      this.passwordNotMatch = true;
    }else{
      this.passwordNotMatch = false;
    }
  }

  passwordNotMatch: boolean = false;


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

    setTimeout(() => {
      this.containerVisible = true;
    }, 200); // Retraso en milisegundos
  }

  update(): void {

    this.checkPasswordMatch();
    if(this.passwordNotMatch){return;}
    if (!this.id) {return;}
    if (this.formularioUpdate.invalid) {return;}
    const { password, confirmPassword } = this.formularioUpdate.getRawValue();
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
    this.router.navigateByUrl('home');
  }


}
