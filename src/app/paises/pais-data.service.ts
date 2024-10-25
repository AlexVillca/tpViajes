import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pais } from './pais';

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
