import { Component,HostListener, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

import { IdUsuarioService } from '../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{

  idUsuarioService = inject(IdUsuarioService);
  routerService = inject(Router);
  flag:boolean = false;
  username: string | null = null;
  menuOpen: boolean = false; // Estado del menú
  dropdownOpen: boolean = false; // Estado de la solapa del usuario

  ngOnInit() {
    this.idUsuarioService.session$.subscribe((session) => {
      // La navbar depende de una unica fuente de verdad.
      this.flag = !!session;
      this.username = session?.username || null;
    });

    // Al navegar a otra ruta cerramos el menu movil y la solapa de usuario.
    this.routerService.events
      .pipe(filter(evento => evento instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen = false;
        this.dropdownOpen = false;
      });
  }

  // Cierra ambos menus (por ejemplo al elegir una opcion).
  cerrarMenus() {
    this.menuOpen = false;
    this.dropdownOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen; // Cambia el estado del menú
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen; // Cambia el estado de la solapa
  }

  logOut(){
    // Logout real del estado local.
    this.cerrarMenus();
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
