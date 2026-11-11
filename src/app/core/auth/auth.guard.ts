import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdUsuarioService } from '../service/id-usuario.service';

/**
 * Guarda de ruta: deja entrar solo a usuarios con sesión iniciada. Si no hay sesión, redirige al
 * login guardando a dónde querían ir (returnUrl) para volver ahí después de entrar.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const sessionService = inject(IdUsuarioService);
  const router = inject(Router);

  if (sessionService.isLoggedIn) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
