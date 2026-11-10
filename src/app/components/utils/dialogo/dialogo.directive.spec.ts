import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogoDirective } from './dialogo.directive';

@Component({
  standalone: true,
  imports: [DialogoDirective],
  template: `
    <button id="disparador" type="button" (click)="abierto = true">Abrir</button>
    @if (abierto) {
      <div role="dialog" appDialogo (cerrar)="cerrado = cerrado + 1; abierto = false">
        <button id="primero" type="button">Primero</button>
        <button id="inicial" type="button" data-foco-inicial>Inicial</button>
        <button id="ultimo" type="button">Último</button>
      </div>
    }
  `
})
class AnfitrionComponent {
  abierto = false;
  cerrado = 0;
}

describe('DialogoDirective', () => {
  function abrir() {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const disparador: HTMLButtonElement = fixture.nativeElement.querySelector('#disparador');
    disparador.focus();
    disparador.click();
    fixture.detectChanges();
    return { fixture, disparador };
  }

  function tab(elemento: HTMLElement, shiftKey = false) {
    const evento = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
    elemento.dispatchEvent(evento);
    return evento;
  }

  it('enfoca el elemento inicial al abrir', () => {
    const { fixture } = abrir();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#inicial'));
    fixture.destroy();
  });

  it('mantiene el foco dentro del diálogo con Tab y Shift+Tab', () => {
    const { fixture } = abrir();
    const primero: HTMLElement = fixture.nativeElement.querySelector('#primero');
    const ultimo: HTMLElement = fixture.nativeElement.querySelector('#ultimo');

    ultimo.focus();
    expect(tab(ultimo).defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(primero);

    expect(tab(primero, true).defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(ultimo);
    fixture.destroy();
  });

  it('cierra con Escape y devuelve el foco a quien lo abrió', () => {
    const { fixture, disparador } = abrir();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.cerrado).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(disparador);
    fixture.destroy();
  });
});
