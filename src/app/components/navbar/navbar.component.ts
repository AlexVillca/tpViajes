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
  menuOpen: boolean = false;
  dropdownOpen: boolean = false;

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
    this.idUsuarioService.clearUserId();
    this.routerService.navigate(['home']);
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
