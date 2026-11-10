import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { IdUsuarioService } from '../service/id-usuario.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let idUs: IdUsuarioService;
  let router: { navigate: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    idUs = TestBed.inject(IdUsuarioService);
    idUs.setSession({ id: '1', username: 'u', email: 'e' });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('envía la cookie de sesión (withCredentials) a la API propia, sin encabezado Authorization', () => {
    http.get(`${environment.apiBaseUrl}/usuarios/1`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/usuarios/1`);
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('NO envía credenciales a APIs externas', () => {
    http.get(`${environment.currencyApiUrl}/ARS`).subscribe();

    const req = httpMock.expectOne(`${environment.currencyApiUrl}/ARS`);
    expect(req.request.withCredentials).toBeFalse();
    req.flush({});
  });

  it('ante un 401 limpia la sesión y redirige a /login', () => {
    http.get(`${environment.apiBaseUrl}/usuarios/1`).subscribe({ error: () => {} });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/usuarios/1`)
      .flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(idUs.isLoggedIn).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('un 403 (sin permiso) no cierra la sesión', () => {
    http.patch(`${environment.apiBaseUrl}/usuarios/2`, {}).subscribe({ error: () => {} });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/usuarios/2`)
      .flush('no', { status: 403, statusText: 'Forbidden' });

    expect(idUs.isLoggedIn).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('un 401 del login o de la verificación de sesión no redirige', () => {
    for (const ruta of ['login', 'sesion']) {
      http.get(`${environment.apiBaseUrl}/${ruta}`).subscribe({ error: () => {} });
      httpMock
        .expectOne(`${environment.apiBaseUrl}/${ruta}`)
        .flush('no', { status: 401, statusText: 'Unauthorized' });
    }

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
