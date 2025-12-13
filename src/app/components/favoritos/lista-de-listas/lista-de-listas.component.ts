import { Component, inject, OnInit } from '@angular/core';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { ListaFav } from '../../../models/interface/usuario.interface';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { ImagenesLista } from '../../../models/interface/imagenesLista.interface';
import { PaisesService } from '../../../core/service/paises.service';
import { Pais } from '../../../models/interface/pais.interface';
import { CardComponent } from "../../utils/card/card.component";

@Component({
  selector: 'app-lista-de-listas',
  standalone: true,
  imports: [RouterModule, /*RouterLink,*/ CardComponent],
  templateUrl: './lista-de-listas.component.html',
  styleUrl: './lista-de-listas.component.css'
})
export class ListaDeListasComponent implements OnInit {
  us = inject(UsuariosService);
  ids = inject(IdUsuarioService);
  router = inject(Router);
  paisesService = inject(PaisesService);
  locationService = inject(Location);

  listas: ImagenesLista[] = [];


  ngOnInit(): void {
    this.ids.id$.subscribe(
      {
        next: (idObtenido) => {
          if (idObtenido) {
            this.us.obtenerListasFav(idObtenido).subscribe(
              {
                next: (lista) => {
                  this.paisesService.getPaises().subscribe({
                    next: (paises) => {
                      this.obtenerImagenesListas(lista, paises);
                    },
                    error: (e) => { console.log(e) }
                  });
                },
                error: (e) => { console.log(e) }
              }
            );
          } else {
            console.log("error: no se ah encontrado el id");
          }
        },
        error: (e) => { console.log(e); }
      });
  }

  accederLista(idLista: string) {
    this.router.navigate(['/listaCiudadesComp',idLista]);
  }

  volver() {
    this.locationService.back();
  }

  obtenerImagenesListas(listasFav: ListaFav[], paises: Pais[]): void {
    this.listas = listasFav.map(lista => {
      const imagenes: string[] = [];

      lista.listaCiudades.forEach(ciudadEnLista => {

        const pais = paises.find(p => p.codigo === ciudadEnLista.codigoPais);
        if (!pais) return;

        const ciudad = pais.ciudades?.find(c => c.nombre === ciudadEnLista.nombre);
        if (!ciudad) return;


        const imagenAtr = ciudad.atracciones?.find(a => a.imagen)?.imagen;
        if (imagenAtr) { imagenes.push(imagenAtr); }
      });

      return {
        id: lista.idLista,
        nombre: lista.nombreLista,
        imagenes
      };
    });

  }

  containerVisible = false;
  videoLoaded = false;

  onVideoLoaded() {
    this.videoLoaded = true;

    setTimeout(() => {
      this.containerVisible = true;
    }, 200); // Retraso en milisegundos
  }

}
