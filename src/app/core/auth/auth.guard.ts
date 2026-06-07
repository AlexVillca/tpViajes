import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdUsuarioService } from '../service/id-usuario.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const sessionService = inject(IdUsuarioService);
  const router = inject(Router);

  // Si hay sesion, permitimos navegar.
  if (sessionService.isLoggedIn) {
    return true;
  }

  // Si no hay sesion, redirigimos al login y recordamos el destino.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
