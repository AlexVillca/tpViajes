import { Component, Input, OnInit } from '@angular/core';


@Component({
  selector: 'app-frame',
  standalone: true,
  imports: [],
  templateUrl: './frame.component.html',
  styleUrl: './frame.component.css'
})
export class FrameComponent {
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
