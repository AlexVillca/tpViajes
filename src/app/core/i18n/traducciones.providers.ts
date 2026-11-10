import { EnvironmentProviders } from '@angular/core';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { es } from './es';
import { en } from './en';

/**
 * Los textos viajan dentro de la app (no se descargan aparte), así que están disponibles
 * desde el primer render y no aparecen claves sin traducir mientras carga.
 */
export class CargadorTraducciones implements TranslateLoader {
  getTranslation(idioma: string): Observable<Record<string, unknown>> {
    return of(idioma === 'en' ? en : es);
  }
}

/** Configuración de las traducciones. Se usa en app.config.ts y en los tests. */
export function proveerTraducciones(): EnvironmentProviders {
  return provideTranslateService({
    loader: { provide: TranslateLoader, useClass: CargadorTraducciones },
    defaultLanguage: 'es'
  });
}
