import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { IdUsuarioService } from './core/service/id-usuario.service';
import { UsuariosService } from './core/service/usuarios.service';
import { IdiomaService } from './core/i18n/idioma.service';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { FooterComponent } from "./components/footer/footer.component";
import { RouterOutlet } from '@angular/router';
import { FeedbackToastComponent } from './components/utils/feedback-toast/feedback-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    NavbarComponent,
    FooterComponent,
    FeedbackToastComponent
  ],
  templateUrl: './app.component.html',
  // El contenido crece en páginas cortas; en páginas largas el pie sigue el flujo.
  host: { class: 'isolate flex min-h-screen flex-col' }
})

export class AppComponent implements OnInit, OnDestroy {
  private readonly idUsuario = inject(IdUsuarioService);
  private readonly usuarios = inject(UsuariosService);
  // Se crea al iniciar la app para aplicar el idioma guardado antes del primer render.
  private readonly idioma = inject(IdiomaService);
  reproducirFondo = false;
  private preferenciaMovimiento?: MediaQueryList;
  private readonly actualizarMovimiento = (evento: MediaQueryListEvent): void => {
    this.reproducirFondo = !evento.matches;
  };

  ngOnInit(): void {
    this.preferenciaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reproducirFondo = !this.preferenciaMovimiento.matches;
    this.preferenciaMovimiento.addEventListener('change', this.actualizarMovimiento);

    // Si había una sesión guardada, se confirma con el backend que la cookie sigue vigente.
    if (this.idUsuario.isLoggedIn) {
      this.usuarios.verificarSesion().subscribe();
    }
  }

  ngOnDestroy(): void {
    this.preferenciaMovimiento?.removeEventListener('change', this.actualizarMovimiento);
  }
}
