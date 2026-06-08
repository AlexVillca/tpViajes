import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export function buildHttpError(
  error: HttpErrorResponse,
  fallbackMessage: string
) {
  // status 0 suele indicar que Angular no pudo llegar al json-server.
  if (error.status === 0) {
    return throwError(() => new Error('No se pudo conectar con el servidor.'));
  }

  if (error.status === 404) {
    return throwError(() => new Error('No se encontró el recurso solicitado.'));
  }

  if (error.status >= 500) {
    return throwError(() => new Error('Ocurrió un error en el servidor.'));
  }

  return throwError(() => new Error(fallbackMessage));
}
