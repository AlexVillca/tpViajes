import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaisesService } from '../core/service/paises.service';
import { FeedbackService } from '../core/service/feedback.service';
import { IdUsuarioService } from '../core/service/id-usuario.service';
import { UsuariosService } from '../core/service/usuarios.service';
import { Pais } from '../models/interface/pais.interface';
import { Usuario } from '../models/interface/usuario.interface';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  paisesService = inject(PaisesService);
  idUsuarioService = inject(IdUsuarioService);
  servicioUsuario = inject(UsuariosService);
  routerService = inject(Router);
  feedback = inject(FeedbackService);

  topUsuarios: Usuario[] = [];
  arregloPaises: Pais[] = [];
  paisAleatorio: Pais | null = null;
  opciones: Pais[] = [];
  mensaje = '';
  intentos = 0;
  opcionesDesHabilitadas = false;
  puntaje = 0;
  mejorPuntaje = 0;
  banderaVisible = false;
  flag = false;
  id: string | null = null;
  errorJuego = '';
  errorRanking = '';
  videoLoaded = false;

  ngOnInit(): void {
    this.listar();
    this.cargarTop3();

    this.idUsuarioService.id$.subscribe((id) => {
      if (id !== null) {
        this.flag = true;
        this.id = id;

        this.servicioUsuario.getUsuarioById(id).subscribe({
          next: (usuario) => {
            this.mejorPuntaje = usuario.mejorPuntaje || 0;
          },
          error: () => {
            // Si esta lectura falla, el juego igual puede continuar con el mejor puntaje en cero.
            this.mejorPuntaje = 0;
          },
        });
      } else {
        this.flag = false;
        this.id = null;
        this.mejorPuntaje = 0;
      }
    });
  }

  cargarTop3() {
    this.servicioUsuario.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        this.errorRanking = '';
        this.topUsuarios = usuarios
          .sort((a, b) => (b.mejorPuntaje || 0) - (a.mejorPuntaje || 0))
          .slice(0, 3);
      },
      error: (e) => {
        // Este estado conviene verlo en pantalla para que el ranking vacio no parezca normal.
        this.errorRanking = e.message;
        this.topUsuarios = [];
      }
    });
  }

  listar() {
    this.paisesService.getPaises().subscribe({
      next: (paises: Pais[]) => {
        this.arregloPaises = paises;
        this.generarPregunta();
      },
      error: (e: Error) => {
        this.errorJuego = e.message;
        this.paisAleatorio = null;
        this.opciones = [];
        this.mensaje = '';
      }
    });
  }

  generarPregunta() {
    // Con menos de 4 paises el while de opciones no puede completarse.
    if (this.arregloPaises.length < 4) {
      this.errorJuego = 'No hay suficientes paises para iniciar el minijuego.';
      this.paisAleatorio = null;
      this.opciones = [];
      this.mensaje = '';
      return;
    }

    this.errorJuego = '';
    this.opcionesDesHabilitadas = false;

    const indiceCorrecto = Math.floor(Math.random() * this.arregloPaises.length);
    this.paisAleatorio = this.arregloPaises[indiceCorrecto];

    this.opciones = [this.paisAleatorio];
    while (this.opciones.length < 4) {
      const opcionAleatoria = this.arregloPaises[Math.floor(Math.random() * this.arregloPaises.length)];
      if (!this.opciones.includes(opcionAleatoria)) {
        this.opciones.push(opcionAleatoria);
      }
    }

    this.opciones = this.opciones.sort(() => Math.random() - 0.5);

    this.banderaVisible = false;
    setTimeout(() => {
      this.banderaVisible = true;
    }, 200);

    setTimeout(() => {
      const listaOpciones = document.querySelectorAll('.lista-opciones li');
      listaOpciones.forEach((li) => {
        li.classList.add('visible');
      });
    }, 100);

    setTimeout(() => {
      this.opciones.forEach(opcion => opcion['visible'] = true);
    }, 100);
  }

  verificarRespuesta(pais: Pais) {
    if (pais === this.paisAleatorio) {
      this.mensaje = 'Correcto!';
      this.puntaje++;
      this.opcionesDesHabilitadas = true;
      setTimeout(() => this.reiniciarJuego(), 2000);
      return;
    }

    this.intentos++;
    if (this.intentos >= 2) {
      this.mensaje = 'Intentos agotados. Reiniciando...';

      if (this.puntaje > this.mejorPuntaje) {
        this.mejorPuntaje = this.puntaje;

        if (this.flag && this.id) {
          this.servicioUsuario.actualizarPuntajeMaximo(this.id, this.mejorPuntaje).subscribe({
            next: () => {
              this.cargarTop3();
            },
            error: (e) => this.feedback.error(e.message)
          });
        }
      }

      this.puntaje = 0;
      this.opcionesDesHabilitadas = true;
      setTimeout(() => this.reiniciarJuego(), 2000);
      return;
    }

    this.mensaje = 'Incorrecto, intenta de nuevo.';
  }

  reiniciarJuego() {
    this.intentos = 0;
    this.mensaje = '';

    if (!this.errorJuego && this.arregloPaises.length >= 4) {
      this.generarPregunta();
    }
  }

  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');
      });
    }, 200);
  }
}
