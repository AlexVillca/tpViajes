import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { NgZone } from '@angular/core';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { FichaUserComponent } from './core/auth/ficha-user/ficha-user.component';
import { PaisesListComponent } from './components/paises/paises-list/paises-list.component';
import { CiudadDetailComponent } from './components/paises/ciudad-detail/ciudad-detail.component';
import { PaisDetailComponent } from './components/paises/pais-detail/pais-detail.component';
import { ListaDeListasComponent } from './components/favoritos/lista-de-listas/lista-de-listas.component';
import { IdUsuarioService } from './core/service/id-usuario.service';
import { UsuariosService } from './core/service/usuarios.service';
import { PaisesService } from './core/service/paises.service';
import { ComentariosService } from './core/service/comentarios.service';
import { PaisDataService } from './core/service/pais-data.service';
import { CiudadDataService } from './core/service/ciudad-data.service';
import { ClimaService } from './core/service/clima.service';
import { CurrencyService } from './core/service/currency.service';
import { RestCountriesService } from './core/service/rest-countries.service';
import { ValoracionesService } from './core/service/valoraciones.service';
import { MapComponent } from './components/map/map.component';
import { LoginFormComponent } from './core/auth/login-form/login-form.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { ContactUsComponent } from './components/home/contact-us/contact-us.component';
import { AboutUsComponent } from './components/home/about-us/about-us.component';
import { proveerTraducciones } from './core/i18n/traducciones.providers';

describe('AppComponent - fondo compartido', () => {
  let fixture: ComponentFixture<AppComponent>;
  let cambiarMovimiento: (evento: MediaQueryListEvent) => void;
  let preferencia: MediaQueryList;
  let router: Router;

  beforeEach(async () => {
    preferencia = {
      matches: false,
      addEventListener: jasmine.createSpy().and.callFake((_tipo, listener) => { cambiarMovimiento = listener; }),
      removeEventListener: jasmine.createSpy()
    } as unknown as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(preferencia);
    const session = new BehaviorSubject({ id: 'usuario', username: 'Viajera', email: 'viajera@example.test' });
    const ciudad = { nombre: 'Buenos Aires', atracciones: [] };
    const pais = { id: 'ar', nombre: 'Argentina', codigo: 'AR', visible: true, ciudades: [ciudad] };
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [proveerTraducciones(), provideRouter([
        { path: '', component: HomeComponent },
        { path: 'fichaUser', component: FichaUserComponent },
        { path: 'paises', component: PaisesListComponent },
        { path: 'pais', component: PaisDetailComponent },
        { path: 'ciudad', component: CiudadDetailComponent },
        { path: 'favoritos', component: ListaDeListasComponent },
        { path: 'login', component: LoginFormComponent },
        { path: 'register', component: RegisterComponent },
        { path: 'contact', component: ContactUsComponent },
        { path: 'about', component: AboutUsComponent }
      ]),
      { provide: IdUsuarioService, useValue: { session$: session, id$: of('usuario') } },
      { provide: UsuariosService, useValue: { obtenerListasFav: () => of([]), comprobarNombreExistenteDeLista: () => of(false) } },
      { provide: PaisesService, useValue: { getPaises: () => of([pais]) } },
      { provide: ComentariosService, useValue: { getComentarios: () => of([]) } },
      { provide: PaisDataService, useValue: { pais$: of(pais) } },
      { provide: CiudadDataService, useValue: { ciudad$: of(ciudad) } },
      { provide: ClimaService, useValue: { getClima: () => of(null) } },
      { provide: CurrencyService, useValue: { extraerCodigoIso: () => null } },
      { provide: RestCountriesService, useValue: { getInfoPais: () => of(null) } },
      { provide: ValoracionesService, useValue: { getValoraciones: () => of([]) } }
      ]
    }).compileComponents();
    spyOn(MapComponent.prototype, 'ngAfterViewInit');
    spyOn(MapComponent.prototype, 'ngOnChanges');
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
  });

  afterEach(() => fixture.destroy());

  it('conserva un solo video al navegar por las secciones y no depende de su carga', async () => {
    fixture.detectChanges();
    const video: HTMLVideoElement = fixture.nativeElement.querySelector('video');
    expect(video.muted && video.autoplay && video.loop && video.playsInline).toBeTrue();
    expect(video.querySelector('source')?.getAttribute('src')).toBe('assets/background-video.mp4');
    for (const url of ['/', '/fichaUser', '/paises', '/pais', '/ciudad', '/login', '/register', '/contact', '/about', '/favoritos']) {
      await TestBed.inject(NgZone).run(() => router.navigateByUrl(url));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('video').length).withContext(url).toBe(1);
      expect(fixture.nativeElement.querySelector('video')).toBe(video);
      expect(fixture.nativeElement.querySelector('.app-content main')).not.toBeNull();
    }
    for (const evento of ['error', 'stalled', 'loadeddata', 'pause']) video.dispatchEvent(new Event(evento));
    fixture.detectChanges();
    const main: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(getComputedStyle(main).opacity).toBe('1');
    expect(fixture.nativeElement.querySelector('app-navbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-footer')).not.toBeNull();
  });

  it('no crea video con movimiento reducido, conserva el fondo y responde a cambios', () => {
    Object.defineProperty(preferencia, 'matches', { value: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    const fondo: HTMLElement = fixture.nativeElement.querySelector('[aria-hidden="true"]');
    expect(getComputedStyle(fondo).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(fondo).backgroundImage).toContain('gradient');
    expect(getComputedStyle(fondo).pointerEvents).toBe('none');
    cambiarMovimiento({ matches: false } as MediaQueryListEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('video').length).toBe(1);
    cambiarMovimiento({ matches: true } as MediaQueryListEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    fixture.destroy();
    expect(preferencia.removeEventListener).toHaveBeenCalledWith('change', cambiarMovimiento);
  });

  it('mantiene capas, contraste de paneles, controles y footer en flujo a distintos tamaños', async () => {
    Object.defineProperty(preferencia, 'matches', { value: true });
    fixture.detectChanges();
    await TestBed.inject(NgZone).run(() => router.navigateByUrl('/fichaUser'));
    fixture.detectChanges();
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    for (const [width, height] of [[320, 568], [375, 667], [768, 600], [1024, 768], [1440, 900]]) {
      const frame = document.createElement('iframe');
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      frame.style.position = 'fixed';
      frame.style.top = '0';
      frame.style.left = '0';
      frame.style.zIndex = '99999';
      const loaded = new Promise<void>(resolve => { frame.onload = () => resolve(); });
      frame.srcdoc = `<!doctype html><html><head><style>${styles}</style></head><body>${fixture.nativeElement.outerHTML}</body></html>`;
      document.body.appendChild(frame);
      try {
        await loaded;
        const doc = frame.contentDocument!;
        const win = frame.contentWindow!;
        const root = doc.querySelector('[ng-version]') as HTMLElement;
        const fondo: HTMLElement = root.firstElementChild as HTMLElement;
        const navbar = doc.querySelector('.navbar')!;
        const footer = doc.querySelector('.footer')!;
        const main = doc.querySelector('main')!;
        const panel = main.querySelector('section')!;
        expect(win.getComputedStyle(root).isolation).toBe('isolate');
        expect(win.getComputedStyle(fondo).position).toBe('fixed');
        expect(win.getComputedStyle(fondo).pointerEvents).toBe('none');
        expect(navbar.getBoundingClientRect().height).toBe(72);
        expect(win.getComputedStyle(footer).position).toBe('static');
        expect(footer.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(win.innerHeight - 1);
        expect(win.getComputedStyle(panel).backgroundColor).toBe('rgba(255, 255, 255, 0.9)');
        expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        const link = main.querySelector<HTMLAnchorElement>('a[href="/favoritos"]')!;
        link.scrollIntoView({ block: 'center' });
        const rect = link.getBoundingClientRect();
        const target = doc.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(target === link || link.contains(target)).toBeTrue();
        const extra = doc.createElement('div');
        extra.style.height = '1600px';
        main.appendChild(extra);
        expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom);
        expect(doc.documentElement.scrollHeight).toBeGreaterThan(height);
        expect(win.getComputedStyle(doc.body).overflowY).not.toBe('hidden');
      } finally { frame.remove(); }
    }
  });
});