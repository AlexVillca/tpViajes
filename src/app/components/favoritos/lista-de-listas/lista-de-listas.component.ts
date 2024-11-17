import { Component, inject, OnInit } from '@angular/core';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-lista-de-listas',
  standalone: true,
  imports: [RouterModule,RouterLink],
  templateUrl: './lista-de-listas.component.html',
  styleUrl: './lista-de-listas.component.css'
})
export class ListaDeListasComponent implements OnInit{
    us = inject(UsuariosService);
    ids = inject(IdUsuarioService);
    router = inject(Router);

    listaDeListas:ListaFav[] = [];

    containerVisible = false;

    ngOnInit(): void {
      this.ids.id$.subscribe({
        next:(idObtenido) => {
            if(idObtenido){
              this.us.obtenerListasFav(idObtenido).subscribe(
                {
                  next:(lista)=> {this.listaDeListas = lista},
                  error:(e)=> {console.log(e)}
                }
              )
            }else{
              console.log("error: no se a podido obtener el id");
            }
        },
        error:(e) => {console.log(e);}
      });

      setTimeout(() => {
        this.containerVisible = true;
      }, 200); // Retraso en milisegundos
    }
    accederLista(lista:any){
        this.router.navigate(['listaCiudades']);
    }


    locationService = inject(Location);
  volver() {
    this.locationService.back();
  }

  videoLoaded = false;

  // Esta función se llama cuando el video se carga completamente
  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');  // Añadir la clase 'visible' a los botones
      });
    }, 200);  // Se espera 200ms para asegurarse de que todo se renderice correctamente
  }

  
}
