import { Component,HostListener, inject, OnInit } from '@angular/core';
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
  menuOpen: boolean = false; // Estado del menú
  dropdownOpen: boolean = false; // Estado de la solapa del usuario

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

  toggleMenu() {
    this.menuOpen = !this.menuOpen; // Cambia el estado del menú
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen; // Cambia el estado de la solapa
  }

  logOut(){
    this.idUsuarioService.clearUserId();
    this.routerService.navigate(['home']);
  }

  goToUserProfile() {
    this.routerService.navigate(['fichaUser']);
  }

  // Detecta clics fuera del menú y lo cierra si está abierto
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const isInsideMenu = target.closest('.navbar-container');
    const isInsideDropdown = target.closest('.user-dropdown') || target.closest('.user-image');

    if (!isInsideMenu && !isInsideDropdown && this.dropdownOpen) {
      this.dropdownOpen = false; // Cierra la solapa si el clic está fuera de ella
    }

    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false; // Cierra el menú si el clic está fuera de él
    }
  }

}
