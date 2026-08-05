import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IdUsuarioService } from '../service/id-usuario.service';
import { environment } from '../../../environments/environment';

// Inyecta el JWT en las requests hacia nuestro backend y maneja 401/403
// de forma centralizada (sesion expirada -> logout + redirect a login).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const idUs = inject(IdUsuarioService);
  const router = inject(Router);

  const esApiPropia = req.url.startsWith(environment.apiBaseUrl);
  const esLogin = req.url === `${environment.apiBaseUrl}/login`;
  const token = idUs.getToken();

  // Solo adjuntamos el token a nuestra API (nunca a APIs externas que tienen
  // su propia autenticacion, como REST Countries) y nunca al propio login.
  let peticion = req;
  if (esApiPropia && !esLogin && token) {
    peticion = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esApiPropia && !esLogin && (error.status === 401 || error.status === 403)) {
        // Token invalido o expirado: limpiamos la sesion y volvemos al login.
        idUs.clearUserId();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
