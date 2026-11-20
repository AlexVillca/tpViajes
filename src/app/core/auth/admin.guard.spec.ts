import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { IdUsuarioService, SessionUser } from '../service/id-usuario.service';

describe('adminGuard', () => {
  function ejecutar(sesion: SessionUser | null): boolean | UrlTree {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: IdUsuarioService, useValue: { isLoggedIn: !!sesion, esAdmin: sesion?.rol === 'admin' } }]
    });
    return TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never)) as boolean | UrlTree;
  }

  it('sin sesión manda al login recordando a dónde iba', () => {
    const resultado = ejecutar(null) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login?returnUrl=%2Fadmin');
  });

  it('un usuario común vuelve al inicio', () => {
    const resultado = ejecutar({ id: '1', username: 'viajera', email: 'v@e.com', rol: 'usuario' }) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/');
  });

  it('un admin entra', () => {
    expect(ejecutar({ id: '2', username: 'jefa', email: 'j@e.com', rol: 'admin' })).toBeTrue();
  });
});
