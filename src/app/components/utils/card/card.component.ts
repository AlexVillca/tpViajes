import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() titulo:string = "";
  @Input() arregloImagenes:string[] = [];
  @Input() idLista:string = ""

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


}
