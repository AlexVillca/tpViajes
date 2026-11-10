import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { IdiomaService } from './idioma.service';
import { proveerTraducciones } from './traducciones.providers';

describe('IdiomaService', () => {
  const pais = {
    nombre: 'Alemania',
    visa: { descripcion: 'Sin visa hasta 90 días' },
    clima: 'Templado',
    en: { nombre: 'Germany', visa: { descripcion: 'Visa-free up to 90 days' } }
  };

  function crear() {
    TestBed.configureTestingModule({ providers: [proveerTraducciones()] });
    return TestBed.inject(IdiomaService);
  }

  beforeEach(() => localStorage.removeItem('deruta_idioma'));
  afterEach(() => {
    localStorage.removeItem('deruta_idioma');
    document.documentElement.lang = 'es';
  });

  it('arranca en español y marca el documento con lang="es"', () => {
    const idioma = crear();
    expect(idioma.actual).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(TestBed.inject(TranslateService).instant('comun.volver')).toBe('Volver');
  });

  it('al cambiar a inglés traduce la interfaz, actualiza lang y recuerda la elección', () => {
    const idioma = crear();
    idioma.alternar();

    expect(idioma.actual).toBe('en');
    expect(idioma.locale).toBe('en-US');
    expect(document.documentElement.lang).toBe('en');
    expect(TestBed.inject(TranslateService).instant('comun.volver')).toBe('Back');
    expect(localStorage.getItem('deruta_idioma')).toBe('en');
  });

  it('respeta el idioma guardado en una visita anterior', () => {
    localStorage.setItem('deruta_idioma', 'en');
    expect(crear().actual).toBe('en');
  });

  it('muestra los datos de la base en el idioma elegido y cae al español si falta la traducción', () => {
    const idioma = crear();
    expect(idioma.dato(pais, 'nombre')).toBe('Alemania');
    expect(idioma.dato(pais, 'visa.descripcion')).toBe('Sin visa hasta 90 días');

    idioma.cambiar('en');
    expect(idioma.dato(pais, 'nombre')).toBe('Germany');
    expect(idioma.dato(pais, 'visa.descripcion')).toBe('Visa-free up to 90 days');
    expect(idioma.dato(pais, 'clima')).toBe('Templado');
    expect(idioma.dato(null, 'nombre')).toBe('');
  });
});
