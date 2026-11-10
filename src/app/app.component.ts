import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
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
  reproducirFondo = false;
  private preferenciaMovimiento?: MediaQueryList;
  private readonly actualizarMovimiento = (evento: MediaQueryListEvent): void => {
    this.reproducirFondo = !evento.matches;
  };

  ngOnInit(): void {
    this.preferenciaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reproducirFondo = !this.preferenciaMovimiento.matches;
    this.preferenciaMovimiento.addEventListener('change', this.actualizarMovimiento);
  }

  ngOnDestroy(): void {
    this.preferenciaMovimiento?.removeEventListener('change', this.actualizarMovimiento);
  }
}
