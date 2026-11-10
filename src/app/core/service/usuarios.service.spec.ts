import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ErrorDatoEnUso, UsuariosService } from './usuarios.service';
import { IdUsuarioService } from './id-usuario.service';
import { environment } from '../../../environments/environment';

describe('UsuariosService - sesión y perfil', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;
  let idUs: IdUsuarioService;
  const usuario = { id: '1', username: 'viajera', email: 'e@e.com' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
    idUs = TestBed.inject(IdUsuarioService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login acepta email o nombre de usuario y guarda solo los datos visibles de la sesión', () => {
    const spy = spyOn(idUs, 'setSession');
    let res: boolean | null = false;

    service.login('  viajera ', 'pass').subscribe(v => (res = v));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario: 'viajera', password: 'pass' });
    req.flush({ user: usuario });

    expect(res).toBeTrue();
    expect(spy).toHaveBeenCalledWith(usuario);
    expect(localStorage.getItem('deruta_token')).toBeNull();
  });

  it('contraseña incorrecta (401) devuelve false', () => {
    let res: boolean | null = true;

    service.login('e@e.com', 'mala').subscribe(v => (res = v));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/login`)
      .flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(res).toBeFalse();
  });

  it('usuario inexistente (404) devuelve null', () => {
    let res: boolean | null = false;

    service.login('nadie', 'x').subscribe(v => (res = v));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/login`)
      .flush('no', { status: 404, statusText: 'Not Found' });

    expect(res).toBeNull();
  });

  it('logout cierra la sesión local aunque el backend no responda', () => {
    idUs.setSession(usuario);
    let terminado = false;

    service.logout().subscribe(() => (terminado = true));
    httpMock.expectOne(`${environment.apiBaseUrl}/logout`).flush('caido', { status: 500, statusText: 'Error' });

    expect(terminado).toBeTrue();
    expect(idUs.isLoggedIn).toBeFalse();
  });

  it('verificarSesion cierra la sesión local si la cookie venció (401)', () => {
    idUs.setSession(usuario);

    service.verificarSesion().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/sesion`).flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(idUs.isLoggedIn).toBeFalse();
  });

  it('verificarSesion mantiene la sesión si el backend no está disponible', () => {
    idUs.setSession(usuario);

    service.verificarSesion().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/sesion`).error(new ProgressEvent('error'));

    expect(idUs.currentSession).toEqual(usuario);
  });

  it('actualizarPerfil guarda los datos nuevos de la sesión', () => {
    idUs.setSession(usuario);

    service.actualizarPerfil({ username: 'nueva' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/perfil`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ username: 'nueva' });
    req.flush({ user: { ...usuario, username: 'nueva' } });

    expect(idUs.currentSession?.username).toBe('nueva');
  });

  it('actualizarPerfil informa qué dato ya está en uso (409)', () => {
    let error: unknown;

    service.actualizarPerfil({ email: 'otro@e.com' }).subscribe({ error: e => (error = e) });
    httpMock.expectOne(`${environment.apiBaseUrl}/perfil`).flush({ campo: 'email' }, { status: 409, statusText: 'Conflict' });

    expect(error instanceof ErrorDatoEnUso).toBeTrue();
    expect((error as ErrorDatoEnUso).campo).toBe('email');
  });
});
