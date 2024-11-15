import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../service/usuarios.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.css'
})

export class UpdatePasswordComponent implements OnInit{

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(
      {
        next:(param)=>{
          this.id = param.get('id')
          if (this.id) {
            this.getUsuarioById(this.id);
          } else {
            console.error('No se recibio el id del producto');
          }
        },
        error: (e: Error) => {
          console.log(e.message);
        }
      }
    )
  }

  id: string | null= 'null';


  fb = inject(FormBuilder)
  usuariosService = inject(UsuariosService)
  router = inject(Router)
  activatedRoute = inject(ActivatedRoute)

  formularioUpdate = this.fb.nonNullable.group({
    username: ['',[Validators.required]],
    email: ['',[Validators.required]],
    password:['',[Validators.required]]

  }
  )

  getUsuarioById(id: string){
    this.usuariosService.getUsuarioById(id).subscribe(
      {
        next: (usuario : Usuario) => {
            this.formularioUpdate.controls['username'].setValue(usuario.username)
            this.formularioUpdate.controls['email'].setValue(usuario.email)
            this.formularioUpdate.controls['password'].setValue(usuario.password)
        },
        error: (e: Error) =>{
          console.log(e.message)
          console.log(e.stack);
        }
      }
    )
 }

 update(){
  if(this.formularioUpdate.invalid)return;
  const usuario: Usuario = this.formularioUpdate.getRawValue()
  if (this.id === null) {
    console.error('No se recibio el id del producto');
    return;
  }
    this.usuariosService.putUsuario(usuario, this.id).subscribe(
    {
      next: () => {
        this.router.navigateByUrl('home')
        alert("El producto ha sido modificado")
      },
      error: (e: Error) => {
        console.log(e.message);
      }
    }
  )
}

}


