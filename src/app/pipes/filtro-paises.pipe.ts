import { Pipe, PipeTransform } from '@angular/core';
import { Pais } from '../models/interface/pais.interface';

@Pipe({
  name: 'filtroPaises',
  standalone: true
})
export class FiltroPaisesPipe implements PipeTransform {

  transform(paises: Pais[], letra: string): Pais[] {
    if (!letra || letra === 'todos') {
      return paises;
    }
    return paises.filter(pais => pais.nombre.toLowerCase().startsWith(letra.toLowerCase()));
  }
}
