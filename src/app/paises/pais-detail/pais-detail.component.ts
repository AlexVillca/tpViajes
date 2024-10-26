import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../pais-data.service';
import { CiudadDataService } from '../ciudad-data.service'; // Importar el servicio
import { Router } from '@angular/router'; //
import { Ciudad } from '../pais';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pais-detail.component.html',
  styleUrls: ['./pais-detail.component.css']
})
export class PaisDetailComponent{

  pais$ = this.paisDataService.pais$;

  constructor(
    private paisDataService: PaisDataService,
    private ciudadDataService: CiudadDataService, // Inyectar el servicio
    private router: Router // Inyectar Router
  ) { }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadDataService.setCiudad(ciudad);
    this.router.navigate(['/ciudad']);
  }

  volver() {
    this.router.navigate(['/paises']);
  }
}
