import { Injectable } from '@angular/core'; // Importa el decorador Injectable para que la clase pueda ser inyectada como un servicio.
import { BehaviorSubject } from 'rxjs'; // Importa BehaviorSubject de RxJS para manejar la información del país seleccionado.
import { Pais } from '../../models/interface/pais.interface'; // Importa la interfaz Pais que define la estructura de los datos de un país.

@Injectable({ // Decora la clase como un servicio inyectable.
  providedIn: 'root' // Indica que el servicio estará disponible en el inyector raíz de la aplicación.
})
export class PaisDataService {
  private paisSource = new BehaviorSubject<Pais | null>(null); // Crea un BehaviorSubject para almacenar el país seleccionado. Se inicializa con null.
  pais$ = this.paisSource.asObservable(); // Crea un Observable a partir del BehaviorSubject para que otros componentes puedan suscribirse y recibir el país seleccionado.

  setPais(pais: Pais) { // Define la función setPais que recibe un objeto Pais y lo actualiza en el BehaviorSubject.
    this.paisSource.next(pais); // Emite el nuevo valor del país al BehaviorSubject, notificando a los suscriptores del cambio.
  }
}

/*
@Injectable({ providedIn: 'root' }):  Esta línea indica que PaisDataService es un servicio inyectable y que estará disponible en el inyector raíz de la aplicación. Esto significa que cualquier componente puede inyectar y usar este servicio.

private paisSource = new BehaviorSubject<Pais | null>(null);:

private paisSource: Declara una variable privada llamada paisSource para almacenar una instancia de BehaviorSubject.
new BehaviorSubject<Pais | null>(null): Crea una nueva instancia de BehaviorSubject.
BehaviorSubject: Es un tipo especial de Observable en RxJS que:
Almacena el último valor emitido.
Envía ese último valor a cualquier nuevo suscriptor inmediatamente.
<Pais | null>: Indica que el BehaviorSubject emitirá valores de tipo Pais o null.
(null): Inicializa el BehaviorSubject con el valor null, ya que al principio no hay ningún país seleccionado.
pais$ = this.paisSource.asObservable();:

pais$: Declara una variable pública llamada pais$ (el signo $ al final es una convención para indicar que es un Observable).
this.paisSource.asObservable(): Convierte el BehaviorSubject (paisSource) en un Observable. Esto se hace para que otros componentes puedan suscribirse a pais$ y recibir el país seleccionado sin poder modificar directamente el BehaviorSubject.
setPais(pais: Pais):

setPais(pais: Pais): Define una función pública llamada setPais que recibe un objeto de tipo Pais como argumento.
this.paisSource.next(pais);: Esta línea es la clave para actualizar el país seleccionado.
this.paisSource: Accede al BehaviorSubject.
.next(pais): Emite un nuevo valor (pais) al BehaviorSubject. Esto notifica a todos los componentes que estén suscritos a pais$ que el país seleccionado ha cambiado.
*/
