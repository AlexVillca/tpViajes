import { Component,HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { IdUsuarioService } from '../../core/service/id-usuario.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  idUsuarioService = inject(IdUsuarioService);
  routerService = inject(Router);
  flag:boolean = false;
  menuOpen: boolean = false; // Estado del menú
  ngOnInit() {
    this.idUsuarioService.id$.subscribe((valor) => {

      if(valor !== null){
        this.flag = true;


      }else{
        this.flag = false;
      }
    });
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen; // Cambia el estado del menú
  }

  logOut(){
    this.idUsuarioService.clearUserId();
    this.routerService.navigate(['home']);
  }
  // Detecta clics fuera del menú y lo cierra si está abierto
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const isInsideMenu = target.closest('.navbar-container');

    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false; // Cierra el menú si el clic está fuera de él
    }
  }

}
