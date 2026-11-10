import { TestBed } from '@angular/core/testing';
import { IdUsuarioService } from './id-usuario.service';

describe('IdUsuarioService', () => {
  let service: IdUsuarioService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('guarda los datos visibles de la sesión', () => {
    service = TestBed.inject(IdUsuarioService);
    service.setSession({ id: '1', username: 'u', email: 'e' });

    expect(service.isLoggedIn).toBeTrue();
    expect(service.currentSession).toEqual({ id: '1', username: 'u', email: 'e' });
  });

  it('clearUserId limpia la sesión', () => {
    service = TestBed.inject(IdUsuarioService);
    service.setSession({ id: '1', username: 'u', email: 'e' });
    service.clearUserId();

    expect(service.isLoggedIn).toBeFalse();
    expect(service.currentSession).toBeNull();
    expect(localStorage.getItem('deruta_session')).toBeNull();
  });

  it('borra el token que versiones anteriores dejaban en localStorage', () => {
    localStorage.setItem('deruta_token', 'viejo');
    service = TestBed.inject(IdUsuarioService);

    expect(localStorage.getItem('deruta_token')).toBeNull();
  });
});
