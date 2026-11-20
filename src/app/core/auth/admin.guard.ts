import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdUsuarioService } from '../service/id-usuario.service';

/**
 * Guarda de ruta del panel de administración. Sin sesión manda al login; con sesión pero sin rol
 * de admin, al inicio. Es solo para la interfaz: el backend vuelve a controlar el rol en cada pedido.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const sesion = inject(IdUsuarioService);
  const router = inject(Router);

  if (!sesion.isLoggedIn) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return sesion.esAdmin ? true : router.createUrlTree(['/']);
};
