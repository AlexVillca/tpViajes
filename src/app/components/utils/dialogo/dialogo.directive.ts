import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';

const ENFOCABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Comportamiento accesible para modales:
 * - al abrir, mueve el foco al elemento marcado con `data-foco-inicial` (o al primero enfocable);
 * - mantiene el foco dentro del diálogo con Tab / Shift+Tab;
 * - emite `cerrar` al presionar Escape;
 * - al cerrarse, devuelve el foco al elemento que estaba activo antes de abrir.
 */
@Directive({
  selector: '[appDialogo]',
  standalone: true
})
export class DialogoDirective implements AfterViewInit, OnDestroy {
  @Output() cerrar = new EventEmitter<void>();

  private readonly elemento: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private focoPrevio: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inicial = this.elemento.querySelector<HTMLElement>('[data-foco-inicial]') ?? this.enfocables()[0] ?? this.elemento;
    inicial.focus();
  }

  ngOnDestroy(): void {
    if (this.focoPrevio?.isConnected) {
      this.focoPrevio.focus();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  alPresionarEscape(evento: Event): void {
    evento.preventDefault();
    this.cerrar.emit();
  }

  @HostListener('keydown.tab', ['$event'])
  @HostListener('keydown.shift.tab', ['$event'])
  alPresionarTab(evento: Event): void {
    const teclado = evento as KeyboardEvent;
    const elementos = this.enfocables();
    if (elementos.length === 0) {
      teclado.preventDefault();
      return;
    }
    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    if (teclado.shiftKey && document.activeElement === primero) {
      teclado.preventDefault();
      ultimo.focus();
    } else if (!teclado.shiftKey && document.activeElement === ultimo) {
      teclado.preventDefault();
      primero.focus();
    }
  }

  private enfocables(): HTMLElement[] {
    return Array.from(this.elemento.querySelectorAll<HTMLElement>(ENFOCABLES));
  }
}
