import { TestBed } from '@angular/core/testing';
import { IdUsuarioService } from './id-usuario.service';

describe('IdUsuarioService', () => {
  let service: IdUsuarioService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdUsuarioService);
  });

  afterEach(() => localStorage.clear());

  it('guarda la sesion y el token', () => {
    service.setSession({ id: '1', username: 'u', email: 'e' }, 'tok123');

    expect(service.isLoggedIn).toBeTrue();
    expect(service.getToken()).toBe('tok123');
    expect(service.currentSession).toEqual({ id: '1', username: 'u', email: 'e' });
  });

  it('clearUserId limpia sesion y token', () => {
    service.setSession({ id: '1', username: 'u', email: 'e' }, 'tok');
    service.clearUserId();

    expect(service.isLoggedIn).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(service.currentSession).toBeNull();
  });

  it('setSession sin token deja getToken en null pero mantiene la sesion', () => {
    service.setSession({ id: '1', username: 'u', email: 'e' });

    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn).toBeTrue();
  });
});
