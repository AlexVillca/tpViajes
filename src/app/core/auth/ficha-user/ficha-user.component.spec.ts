import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FichaUserComponent } from './ficha-user.component';
import { IdUsuarioService, SessionUser } from '../../service/id-usuario.service';
import { authGuard } from '../auth.guard';
import { proveerTraducciones } from '../../i18n/traducciones.providers';

describe('FichaUserComponent - cuenta', () => {
  let session: BehaviorSubject<SessionUser | null>;

  beforeEach(() => {
    session = new BehaviorSubject<SessionUser | null>(null);
    TestBed.configureTestingModule({
      imports: [FichaUserComponent],
      providers: [proveerTraducciones(), provideRouter([]), {
        provide: IdUsuarioService,
        useValue: { session$: session, get isLoggedIn() { return session.value !== null; } }
      }]
    });
  });

  it('muestra únicamente los datos de sesión y los accesos existentes', () => {
    session.next({ id: 'cuenta', username: 'Viajera', email: 'viajera@example.test' });
    const fixture = TestBed.createComponent(FichaUserComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Viajera');
    expect(element.textContent).toContain('viajera@example.test');
    expect(element.querySelector('a[href="/favoritos"]')).not.toBeNull();
    expect(element.querySelector('a[href="/updateP"]')).not.toBeNull();
    expect(element.querySelector('input')).toBeNull();
    session.next(null);
    fixture.detectChanges();
    expect(element.textContent).not.toContain('viajera@example.test');
    expect(element.querySelector('a[href="/favoritos"]')).toBeNull();
    expect(element.querySelector('a[href="/login?returnUrl=%2FfichaUser"]')).not.toBeNull();
  });

  it('no inventa datos para sesiones antiguas', () => {
    session.next({ id: 'antigua', username: '', email: '' });
    const fixture = TestBed.createComponent(FichaUserComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('dd').length).toBe(2);
    for (const value of fixture.nativeElement.querySelectorAll('dd')) {
      expect(value.textContent).toContain('No disponible en la sesión actual');
    }
  });

  it('mantiene los datos largos y los accesos dentro de pantallas móviles y de escritorio', async () => {
    session.next({ id: 'cuenta', username: 'Viajera'.repeat(20), email: 'correo'.repeat(20) + '@example.test' });
    const fixture = TestBed.createComponent(FichaUserComponent);
    fixture.detectChanges();
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); }
      catch { return ''; }
    }).join('\n');

    for (const width of [320, 375, 768, 1024]) {
      const frame = document.createElement('iframe');
      frame.style.width = `${width}px`;
      frame.style.height = '800px';
      const loaded = new Promise<void>(resolve => { frame.onload = () => resolve(); });
      frame.srcdoc = `<style>${styles}</style>${fixture.nativeElement.outerHTML}`;
      document.body.appendChild(frame);
      try {
        await loaded;
        const doc = frame.contentDocument!;
        expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(doc.documentElement.clientWidth);
        expect(doc.querySelectorAll('dt').length).toBe(2);
        expect(doc.querySelectorAll('nav a').length).toBe(2);
        expect(doc.querySelectorAll('nav a.focus-visible\\:outline').length).toBe(2);
        const columns = frame.contentWindow!.getComputedStyle(doc.querySelector('dl')!).gridTemplateColumns;
        expect(columns.split(' ').length).toBe(width < 640 ? 1 : 2);
      } finally {
        frame.remove();
      }
    }
  });

  it('conserva el guard: permite sesión y redirige al login con returnUrl sin sesión', () => {
    const check = () => TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/fichaUser' } as never));
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(check() as ReturnType<Router['parseUrl']>))
      .toBe('/login?returnUrl=%2FfichaUser');
    session.next({ id: 'cuenta', username: 'Viajera', email: 'viajera@example.test' });
    expect(check()).toBeTrue();
  });
});