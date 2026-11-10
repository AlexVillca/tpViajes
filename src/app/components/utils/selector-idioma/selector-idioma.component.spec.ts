import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from '@ngx-translate/core';
import { SelectorIdiomaComponent } from './selector-idioma.component';
import { proveerTraducciones } from '../../../core/i18n/traducciones.providers';

@Component({
  standalone: true,
  imports: [SelectorIdiomaComponent, TranslatePipe],
  template: `<app-selector-idioma></app-selector-idioma><h1>{{ 'comun.volver' | translate }}</h1>`
})
class PaginaDePruebaComponent {}

describe('SelectorIdiomaComponent', () => {
  beforeEach(() => {
    localStorage.removeItem('deruta_idioma');
    TestBed.configureTestingModule({ imports: [PaginaDePruebaComponent], providers: [proveerTraducciones()] });
  });

  afterEach(() => {
    localStorage.removeItem('deruta_idioma');
    document.documentElement.lang = 'es';
  });

  it('es un interruptor accesible que cambia el idioma de toda la página', () => {
    const fixture = TestBed.createComponent(PaginaDePruebaComponent);
    fixture.detectChanges();
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button[role="switch"]');
    const titulo: HTMLElement = fixture.nativeElement.querySelector('h1');

    expect(boton.getAttribute('aria-checked')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('Ver el sitio en inglés');
    expect(titulo.textContent).toBe('Volver');

    boton.click();
    fixture.detectChanges();

    expect(boton.getAttribute('aria-checked')).toBe('true');
    expect(boton.getAttribute('aria-label')).toBe('View the site in English');
    expect(titulo.textContent).toBe('Back');
    expect(document.documentElement.lang).toBe('en');
  });
});
