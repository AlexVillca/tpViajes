import { Component,HostListener, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

import { IdUsuarioService } from '../../core/service/id-usuario.service';
import { UsuariosService } from '../../core/service/usuarios.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { SelectorIdiomaComponent } from '../utils/selector-idioma/selector-idioma.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule,CommonModule, TranslatePipe, SelectorIdiomaComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit{

  idUsuarioService = inject(IdUsuarioService);
  usuariosService = inject(UsuariosService);
  routerService = inject(Router);
  flag:boolean = false;
  username: string | null = null;
  menuOpen: boolean = false;
  dropdownOpen: boolean = false;

  get seccionActiva(): string {
    const segmentos = this.routerService.parseUrl(this.routerService.url)
      .root.children['primary']?.segments.map(segmento => segmento.path) ?? [];

    if (segmentos.length === 0 || (segmentos.length === 1 && segmentos[0] === 'home')) {
      return 'inicio';
    }

    if (segmentos.length === 1) {
      if (['paises', 'pais', 'ciudad'].includes(segmentos[0])) return 'paises';
      if (segmentos[0] === 'favoritos') return 'favoritos';
      if (segmentos[0] === 'Juego') return 'minijuego';
    }

    if (segmentos.length === 2 && segmentos[0] === 'listaCiudadesComp') {
      return 'favoritos';
    }

    return '';
  }

  ngOnInit() {
    this.idUsuarioService.session$.subscribe((session) => {
      this.flag = !!session;
      this.username = session?.username || null;
    });

    this.routerService.events
      .pipe(filter(evento => evento instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen = false;
        this.dropdownOpen = false;
      });
  }

  cerrarMenus() {
    this.menuOpen = false;
    this.dropdownOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logOut(){
    this.cerrarMenus();
    this.usuariosService.logout().subscribe(() => this.routerService.navigate(['home']));
  }

  goToUserProfile() {
    this.routerService.navigate(['fichaUser']);
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const isInsideMenu = target.closest('.navbar-container');
    const isInsideDropdown = target.closest('.user-dropdown') || target.closest('.user-image');

    if (!isInsideMenu && !isInsideDropdown && this.dropdownOpen) {
      this.dropdownOpen = false;
    }

    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false;
    }
  }

}
