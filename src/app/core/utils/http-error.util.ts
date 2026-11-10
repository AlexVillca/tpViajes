import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export function buildHttpError(
  error: HttpErrorResponse,
  fallbackMessage: string
) {
  if (error.status === 0) {
    return throwError(() => new Error('mensajes.sinConexion'));
  }

  if (error.status === 404) {
    return throwError(() => new Error('mensajes.recursoNoEncontrado'));
  }

  if (error.status >= 500) {
    return throwError(() => new Error('mensajes.errorServidor'));
  }

  return throwError(() => new Error(fallbackMessage));
}
