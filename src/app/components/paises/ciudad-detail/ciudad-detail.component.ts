// En ciudad-detail.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { Location } from '@angular/common';
import { SelecionadorListasFlotanteComponent } from '../../favoritos/selecionador-listas-flotante/selecionador-listas-flotante.component';



@Component({
  selector: 'app-ciudad-detail',
  standalone: true,
  imports: [CommonModule,SelecionadorListasFlotanteComponent],
  templateUrl: './ciudad-detail.component.html',
  styleUrls: ['./ciudad-detail.component.css']
})
export class CiudadDetailComponent {
  ciudad$ = this.ciudadDataService.ciudad$;

  showPopup = false;

  constructor(private ciudadDataService: CiudadDataService,  private location: Location) { }

  volver() {
    this.location.back();
  }
}
