import { Component, inject, OnInit } from '@angular/core';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { Router, RouterLink, RouterModule } from '@angular/router';

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
    }
    accederLista(lista:any){
        this.router.navigate(['listaCiudades']);
    }
}
