import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';
import { IdUsuarioService } from './id-usuario.service';
import { environment } from '../../../environments/environment';

describe('UsuariosService - login', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;
  let idUs: IdUsuarioService;

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

  it('login exitoso devuelve true y guarda la sesion con token', () => {
    const spy = spyOn(idUs, 'setSession');
    let res: boolean | null = false;

    service.login('e@e.com', 'pass').subscribe(v => (res = v));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'tok', user: { id: '1', username: 'u', email: 'e@e.com' } });

    expect(res).toBeTrue();
    expect(spy).toHaveBeenCalledWith({ id: '1', username: 'u', email: 'e@e.com' }, 'tok');
  });

  it('contraseña incorrecta (401) devuelve false', () => {
    let res: boolean | null = true;

    service.login('e@e.com', 'mala').subscribe(v => (res = v));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/login`)
      .flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(res).toBeFalse();
  });

  it('email inexistente (404) devuelve null', () => {
    let res: boolean | null = false;

    service.login('nadie@e.com', 'x').subscribe(v => (res = v));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/login`)
      .flush('no', { status: 404, statusText: 'Not Found' });

    expect(res).toBeNull();
  });
});
