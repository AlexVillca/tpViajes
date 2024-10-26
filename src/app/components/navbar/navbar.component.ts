import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { IdUsuarioService } from '../../service/id-usuario.service';
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
  flag:boolean = false;
  ngOnInit() {
    this.idUsuarioService.id$.subscribe((valor) => {

      if(valor !== null){
        this.flag = true;
      }else{
        this.flag = false;
      }
    });
  }
  logOut(){
    this.idUsuarioService.clearUserId();
  }
}
