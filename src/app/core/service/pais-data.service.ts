import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pais } from '../../models/interface/pais.interface';

@Injectable({
  providedIn: 'root'
})

export class PaisDataService {
  private paisSource = new BehaviorSubject<Pais | null>(null); // Crea un BehaviorSubject para almacenar el país seleccionado. Se inicializa con null.
  pais$ = this.paisSource.asObservable(); // Crea un Observable a partir del BehaviorSubject para que otros componentes puedan suscribirse y recibir el país seleccionado.

  setPais(pais: Pais) { // Define la función setPais que recibe un objeto Pais y lo actualiza en el BehaviorSubject.
    this.paisSource.next(pais); // Emite el nuevo valor del país al BehaviorSubject, notificando a los suscriptores del cambio.
  }
}
