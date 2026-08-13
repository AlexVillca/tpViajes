import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IdUsuarioService } from '../service/id-usuario.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const idUs = inject(IdUsuarioService);
  const router = inject(Router);

  const esApiPropia = req.url.startsWith(environment.apiBaseUrl);
  const esLogin = req.url === `${environment.apiBaseUrl}/login`;
  const token = idUs.getToken();

  let peticion = req;
  if (esApiPropia && !esLogin && token) {
    peticion = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esApiPropia && !esLogin && (error.status === 401 || error.status === 403)) {
        idUs.clearUserId();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
