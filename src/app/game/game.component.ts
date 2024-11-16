import { Component, inject } from '@angular/core';
import { Pais } from '../models/interface/pais.interface';
import { CommonModule } from '@angular/common';
import { PaisesService } from '../core/service/paises.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule,CommonModule,HttpClientModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  paisesService = inject(PaisesService);
 
  arregloPaises: Pais[] = [];
  paisAleatorio: Pais | null = null;
  opciones: Pais[] = [];
  mensaje: string = '';
  intentos: number = 0;
  opcionesDesHabilitadas: boolean = false;
  puntaje: number = 0;
  mejorPuntaje: number = 0;

  ngOnInit(): void{
    this.listar()
  }

listar(){
  this.paisesService.getPaises().subscribe({
    next: (paises: Pais[])=>{
        this.arregloPaises = paises;
        console.log(paises);
        /* this.seleccionarBanderaAleatoria(); */
        this.generarPregunta();
    },
    error: (e : Error) => {
      console.log(e.message);
    }
    }); 
   }

  generarPregunta() {
    this.opcionesDesHabilitadas = false;
    // Selecciona el país correcto al azar
    const indiceCorrecto = Math.floor(Math.random() * this.arregloPaises.length);
    this.paisAleatorio = this.arregloPaises[indiceCorrecto];

    // Genera opciones aleatorias incluyendo el país correcto
    this.opciones = [this.paisAleatorio];
    while (this.opciones.length < 4) { // Queremos un total de 4 opciones
      const opcionAleatoria = this.arregloPaises[Math.floor(Math.random() * this.arregloPaises.length)];
      if (!this.opciones.includes(opcionAleatoria)) {
        this.opciones.push(opcionAleatoria);
      }
    }
    this.opciones = this.opciones.sort(() => Math.random() - 0.5);
  }

  verificarRespuesta(pais: Pais) {
    if (pais === this.paisAleatorio) {
      this.mensaje = '¡Correcto!';
      this.puntaje++; //Aumenta el puntaje
      this.opcionesDesHabilitadas = true;
      setTimeout(() => this.reiniciarJuego(), 2000); // Reinicia el juego después de 2 segundos
    } else {
      this.intentos++;
      if(this.intentos>=2){
        this.mensaje = 'Intentos agotados. Reiniciando...';
        // Si el puntaje actual supera el mejor puntaje, actualiza el mejor puntaje
      if (this.puntaje > this.mejorPuntaje) {
        this.mejorPuntaje = this.puntaje;
      }
        this.puntaje = 0; // Reinicia el puntaje actual si pierde
        this.opcionesDesHabilitadas = true;
        setTimeout(() => this.reiniciarJuego(), 2000); // Reinicia el juego después de 2 segundos 
      }else{
        this.mensaje = 'Incorrecto, intenta de nuevo.';

      }
    }
  }

  reiniciarJuego() {
    this.intentos = 0;       // Reinicia el contador de intentos
    this.mensaje = '';       // Borra el mensaje de feedback
    this.generarPregunta();  // Genera una nueva pregunta
  }
}