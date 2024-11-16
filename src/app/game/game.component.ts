import { Component, inject } from '@angular/core';
import { Pais } from '../models/interface/pais.interface';
import { CommonModule } from '@angular/common';
import { PaisesService } from '../core/service/paises.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IdUsuarioService } from '../core/service/id-usuario.service';
import { Router } from '@angular/router';
import { UsuariosService } from '../core/service/usuarios.service';


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

  banderaVisible: boolean = false;

  idUsuarioService = inject(IdUsuarioService);
  servicioUsuario = inject(UsuariosService);
  routerService = inject(Router);
  flag:boolean = false;

  id: string | null = null;


  ngOnInit(): void{
    this.listar()
    this.idUsuarioService.id$.subscribe((id) => {
      if (id !== null) {
        this.flag = true;
        this.id = id;
        this.servicioUsuario.getUsuarioById(id).subscribe({
          next: (usuario) => {
            this.mejorPuntaje = usuario.mejorPuntaje || 0;
          },
          error: (e) => {
            console.error('Error al obtener el usuario:', e);
            this.mejorPuntaje = 0; // Resetea el nombre si hay un error
          },
        });
      } else {
        this.flag = false;
        this.mejorPuntaje = 0; // Resetea el nombre si no hay usuario logueado
      }
    });
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

    // Añadir la clase "visible" con un retraso para activar la animación
  setTimeout(() => {
    this.banderaVisible = true;
  }, 100);
     // Añadir la clase "visible" después de un pequeño retraso para que la animación funcione
  setTimeout(() => {
    const listaOpciones = document.querySelectorAll('.lista-opciones li');
    listaOpciones.forEach((li, index) => {
      li.classList.add('visible');
    });
  }, 100); // Esto aplica la clase después de un pequeño retraso
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
        if (this.flag) {
          this.servicioUsuario.actualizarPuntajeMaximo(this.id!, this.mejorPuntaje).subscribe({
            next: () => console.log('Puntaje actualizado correctamente'),
            error: (e) => console.error('Error al actualizar el puntaje:', e)
          });
        }
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