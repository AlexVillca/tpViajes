import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { IdUsuarioService } from '../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../core/service/usuarios.service';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{

  idUsuarioService = inject(IdUsuarioService);
  usuariosService = inject(UsuariosService);
  routerService = inject(Router);
  flag:boolean = false;
  username: string | null = null;

  ngOnInit() {
    this.idUsuarioService.id$.subscribe((id) => {
      if (id !== null) {
        this.flag = true;

        this.usuariosService.getUsuarioById(id).subscribe({
          next: (usuario) => {
            this.username = usuario.username;
          },
          error: (e) => {
            console.error('Error al obtener el usuario:', e);
            this.username = null; // Resetea el nombre si hay un error
          },
        });
      } else {
        this.flag = false;
        this.username = null; // Resetea el nombre si no hay usuario logueado
      }
    });
  }

  logOut(){
    this.idUsuarioService.clearUserId();
    this.routerService.navigate(['home']);
  }

}
