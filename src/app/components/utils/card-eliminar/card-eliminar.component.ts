import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'app-card-eliminar',
  standalone: true,
  imports: [],
  templateUrl: './card-eliminar.component.html',
  styleUrl: './card-eliminar.component.css'
})
export class CardEliminarComponent {
  @Input() titulo:string = "";
  @Input() arregloImagenes:string[] = [];
  @Output() borrar = new EventEmitter<void>();

  imagenActual: string = '';
  private index = 0;
  private intervalo: any;
  girando = false;

  ngOnInit(): void {
    if(this.arregloImagenes.length == 0){this.imagenActual = "assets/img/imagenvacio.png"}
    this.imagenActual = this.arregloImagenes[0];
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

  setImagenError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/imagennodisponible.png';
  }

  borrarCiudad(event: MouseEvent): void {
  event.stopPropagation();
  this.borrar.emit();
}

}
