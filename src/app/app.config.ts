import { ApplicationConfig } from '@angular/core';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { proveerTraducciones } from './core/i18n/traducciones.providers';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
              provideHttpClient(withInterceptors([authInterceptor])),
              proveerTraducciones()]
};
