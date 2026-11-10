import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type Idioma = 'es' | 'en';

const CLAVE_GUARDADA = 'deruta_idioma';

function leerRuta(objeto: unknown, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>(
    (valor, clave) => (valor !== null && typeof valor === 'object' ? (valor as Record<string, unknown>)[clave] : undefined),
    objeto
  );
}

/**
 * Idioma de la interfaz (español o inglés). Recuerda la elección en localStorage,
 * actualiza el atributo lang del documento y resuelve los textos de la base de datos:
 * en inglés usa el campo "en" de cada país, ciudad o atracción, y si falta cae al español.
 */
@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private readonly translate = inject(TranslateService);
  private readonly idiomaSubject = new BehaviorSubject<Idioma>(this.leerGuardado());

  readonly idioma$ = this.idiomaSubject.asObservable();

  constructor() {
    this.translate.setDefaultLang('es');
    this.aplicar(this.actual);
  }

  get actual(): Idioma {
    return this.idiomaSubject.value;
  }

  get esIngles(): boolean {
    return this.actual === 'en';
  }

  /** Configuración regional para números y fechas (37.254.695 / 37,254,695). */
  get locale(): string {
    return this.esIngles ? 'en-US' : 'es-AR';
  }

  cambiar(idioma: Idioma): void {
    if (idioma === this.actual) return;
    try {
      localStorage.setItem(CLAVE_GUARDADA, idioma);
    } catch {
      // Sin almacenamiento disponible (modo privado): el idioma vale solo para esta visita.
    }
    this.idiomaSubject.next(idioma);
    this.aplicar(idioma);
  }

  alternar(): void {
    this.cambiar(this.esIngles ? 'es' : 'en');
  }

  /** Texto de un campo de la base (admite rutas como "visa.descripcion") en el idioma actual. */
  dato(objeto: unknown, campo: string): string {
    if (this.esIngles) {
      const enIngles = leerRuta(objeto, `en.${campo}`);
      if (typeof enIngles === 'string' && enIngles.trim()) return enIngles;
    }
    const original = leerRuta(objeto, campo);
    return original === null || original === undefined ? '' : String(original);
  }

  private aplicar(idioma: Idioma): void {
    this.translate.use(idioma);
    document.documentElement.lang = idioma;
  }

  private leerGuardado(): Idioma {
    try {
      return localStorage.getItem(CLAVE_GUARDADA) === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }
}
