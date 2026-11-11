import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pais } from '../../models/interface/pais.interface';

/** Guarda en memoria el país seleccionado para compartirlo entre componentes (detalle, ciudad, favoritos). */
@Injectable({
  providedIn: 'root'
})

export class PaisDataService {
  private paisSource = new BehaviorSubject<Pais | null>(null);
  pais$ = this.paisSource.asObservable();

  setPais(pais: Pais) {
    this.paisSource.next(pais);
  }
}
