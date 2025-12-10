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
    }, 2000);
  }

  detenerCarrusel() {
    clearInterval(this.intervalo);
    this.index = 0;
    this.imagenActual = this.arregloImagenes[0];
    this.girando = false;
  }
}
