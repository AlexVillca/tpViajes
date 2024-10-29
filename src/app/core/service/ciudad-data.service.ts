import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ciudad } from '../../models/interface/pais.interface'; // Importar la interfaz Ciudad

@Injectable({
  providedIn: 'root'
})
export class CiudadDataService {
  private ciudadSource = new BehaviorSubject<Ciudad | null>(null);
  ciudad$ = this.ciudadSource.asObservable();

  setCiudad(ciudad: Ciudad) {
    this.ciudadSource.next(ciudad);
  }
}
