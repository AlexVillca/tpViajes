import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaisesService } from '../core/service/paises.service';
import { FeedbackService } from '../core/service/feedback.service';
import { IdUsuarioService } from '../core/service/id-usuario.service';
import { UsuariosService, RankingItem } from '../core/service/usuarios.service';
import { Pais } from '../models/interface/pais.interface';
import { TranslatePipe } from '@ngx-translate/core';
import { DatoPipe } from '../core/i18n/idioma.pipes';

/**
 * Minijuego "adiviná el país por la bandera": arma una pregunta con 4 opciones (una correcta),
 * da 2 intentos, lleva el puntaje y, si el usuario está logueado, guarda su mejor puntaje y
 * refresca el top 3 del ranking.
 */
@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, TranslatePipe, DatoPipe],
  templateUrl: './game.component.html'
})
export class GameComponent {
  paisesService = inject(PaisesService);
  idUsuarioService = inject(IdUsuarioService);
  servicioUsuario = inject(UsuariosService);
  routerService = inject(Router);
  feedback = inject(FeedbackService);

  topUsuarios: RankingItem[] = [];
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
    this.servicioUsuario.getRanking(3).subscribe({
      next: (ranking) => {
        this.errorRanking = '';
        this.topUsuarios = ranking;
      },
      error: (e) => {
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
    if (this.arregloPaises.length < 4) {
      this.errorJuego = 'mensajes.juegoSinPaises';
      this.paisAleatorio = null;
      this.opciones = [];
      this.mensaje = '';
      return;
    }

    this.errorJuego = '';
    this.opcionesDesHabilitadas = false;

    // Elige el país correcto al azar...
    const indiceCorrecto = Math.floor(Math.random() * this.arregloPaises.length);
    this.paisAleatorio = this.arregloPaises[indiceCorrecto];

    // ...y completa hasta 4 opciones con otros países distintos, también al azar.
    this.opciones = [this.paisAleatorio];
    while (this.opciones.length < 4) {
      const opcionAleatoria = this.arregloPaises[Math.floor(Math.random() * this.arregloPaises.length)];
      if (!this.opciones.includes(opcionAleatoria)) {
        this.opciones.push(opcionAleatoria);
      }
    }

    // Mezcla las opciones para que la correcta no quede siempre primera.
    this.opciones = this.opciones.sort(() => Math.random() - 0.5);

    // Pequeñas demoras para la animación de aparición de la bandera y las opciones.
    this.banderaVisible = false;
    setTimeout(() => {
      this.banderaVisible = true;
    }, 200);

    setTimeout(() => {
      this.opciones.forEach(opcion => opcion['visible'] = true);
    }, 100);
  }

  verificarRespuesta(pais: Pais) {
    if (pais === this.paisAleatorio) {
      this.mensaje = 'mensajes.juegoCorrecto';
      this.puntaje++;
      this.opcionesDesHabilitadas = true;
      setTimeout(() => this.reiniciarJuego(), 2000);
      return;
    }

    // A los 2 intentos fallidos se termina la ronda: si fue récord y hay sesión, se guarda en el servidor.
    this.intentos++;
    if (this.intentos >= 2) {
      this.mensaje = 'mensajes.juegoAgotados';

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

    this.mensaje = 'mensajes.juegoIncorrecto';
  }

  reiniciarJuego() {
    this.intentos = 0;
    this.mensaje = '';

    if (!this.errorJuego && this.arregloPaises.length >= 4) {
      this.generarPregunta();
    }
  }
}
