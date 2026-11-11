import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { imagenPorDefecto } from '../../../core/utils/imagen.util';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './card.component.html'
})
export class CardComponent {
  @Input() titulo:string = "";
  @Input() arregloImagenes:string[] = [];
  /** Muestra el botón para quitar el elemento (por ejemplo, una ciudad de una lista). */
  @Input() eliminable = false;
  @Output() borrar = new EventEmitter<void>();

  imagenActual: string = '';
  private index = 0;
  private intervalo?: ReturnType<typeof setInterval>;
  girando = false;

  ngOnInit(): void {
    this.imagenActual = this.arregloImagenes.length > 0
      ? this.arregloImagenes[0]
      : 'assets/imagennodisponible.png';
  }

  iniciarCarrusel() {
    if(this.arregloImagenes.length == 1){
      return
    }
    this.girando = true;
    this.imagenActual = this.arregloImagenes[this.index];
    this.intervalo = setInterval(() => {
      this.index = (this.index + 1) % this.arregloImagenes.length;
      this.imagenActual = this.arregloImagenes[this.index];
    }, 1400);
  }

  detenerCarrusel() {
    clearInterval(this.intervalo);
    this.index = 0;
    this.imagenActual = this.arregloImagenes[0];
    this.girando = false;
  }

  setImagenError = imagenPorDefecto;

  borrarCiudad(event: MouseEvent): void {
    event.stopPropagation();
    this.borrar.emit();
  }

}
