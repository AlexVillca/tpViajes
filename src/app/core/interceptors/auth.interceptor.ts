import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IdUsuarioService } from '../service/id-usuario.service';
import { environment } from '../../../environments/environment';

/**
 * Las peticiones a la API propia viajan con credenciales para que el navegador
 * envíe la cookie httpOnly de la sesión. Ante un 401 (sesión vencida o inexistente)
 * se cierra la sesión local; un 403 solo significa falta de permiso y no la cierra.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const idUs = inject(IdUsuarioService);
  const router = inject(Router);

  const esApiPropia = req.url.startsWith(environment.apiBaseUrl);
  const esLogin = req.url === `${environment.apiBaseUrl}/login`;
  const esVerificacionSesion = req.url === `${environment.apiBaseUrl}/sesion`;

  const peticion = esApiPropia ? req.clone({ withCredentials: true }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esApiPropia && !esLogin && !esVerificacionSesion && error.status === 401) {
        idUs.clearUserId();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
