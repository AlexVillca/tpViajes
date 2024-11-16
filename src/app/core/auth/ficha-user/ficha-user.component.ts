import { Component, inject, OnInit } from '@angular/core';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ficha-user',
  standalone: true,
  imports: [RouterLink,CommonModule],
  templateUrl: './ficha-user.component.html',
  styleUrl: './ficha-user.component.css'
})

export class FichaUserComponent implements OnInit{

  idUsuarioService = inject(IdUsuarioService);
  routerService = inject(Router);
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
}
