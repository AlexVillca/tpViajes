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
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('agrega Authorization en requests a la API propia cuando hay token', () => {
    idUs.setSession({ id: '1', username: 'u', email: 'e' }, 'mitoken');

    http.get(`${environment.apiBaseUrl}/usuarios/1`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/usuarios/1`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mitoken');
    req.flush({});
  });

  it('NO agrega Authorization a APIs externas', () => {
    idUs.setSession({ id: '1', username: 'u', email: 'e' }, 'mitoken');

    http.get(`${environment.currencyApiUrl}/ARS`).subscribe();

    const req = httpMock.expectOne(`${environment.currencyApiUrl}/ARS`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('NO agrega Authorization al endpoint de login', () => {
    idUs.setSession({ id: '1', username: 'u', email: 'e' }, 'mitoken');

    http.post(`${environment.apiBaseUrl}/login`, {}).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('ante un 401 limpia la sesion y redirige a /login', () => {
    idUs.setSession({ id: '1', username: 'u', email: 'e' }, 'mitoken');
    const clearSpy = spyOn(idUs, 'clearUserId').and.callThrough();

    http.get(`${environment.apiBaseUrl}/usuarios/1`).subscribe({
      next: () => {},
      error: () => {}
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/usuarios/1`)
      .flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(clearSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
