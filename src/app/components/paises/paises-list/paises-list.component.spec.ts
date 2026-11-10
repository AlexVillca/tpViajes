import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PaisesListComponent } from './paises-list.component';
import { PaisesService } from '../../../core/service/paises.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { proveerTraducciones } from '../../../core/i18n/traducciones.providers';

describe('PaisesListComponent - presentación y paginación', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaisesListComponent],
      providers: [proveerTraducciones(), provideRouter([]),
        { provide: PaisesService, useValue: {} },
        { provide: PaisDataService, useValue: { setPais: jasmine.createSpy('setPais') } }
      ]
    }).compileComponents();
  });

  function create(count: number) {
    const fixture = TestBed.createComponent(PaisesListComponent);
    const component = fixture.componentInstance;
    spyOn(component, 'cargarPaises');
    component.paises = Array.from({ length: count }, (_, index) => ({
      id: String(index), nombre: `Argentina ${index + 1}`, visible: true
    }));
    component.filtrarPaises('todos');
    fixture.detectChanges();
    return fixture;
  }

  it('conserva doce países, el orden, los filtros y los eventos anterior/siguiente', () => {
    const fixture = create(25);
    const component = fixture.componentInstance;
    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('nav button')) as HTMLButtonElement[];
    expect(component.paisesPagina).toEqual(component.paises.slice(0, 12));
    expect(buttons()[0].disabled).toBeTrue();
    buttons()[1].click();
    fixture.detectChanges();
    expect(component.paisesPagina).toEqual(component.paises.slice(12, 24));
    expect(fixture.nativeElement.querySelector('nav').textContent).toContain('Página 2 de 3');
    buttons()[1].click();
    fixture.detectChanges();
    expect(component.paisesPagina).toEqual(component.paises.slice(24));
    expect(buttons()[1].disabled).toBeTrue();
    buttons()[0].click();
    fixture.detectChanges();
    expect(component.paginaActual).toBe(2);
    component.filtrarPaises('Z');
    fixture.detectChanges();
    expect(component.paginaActual).toBe(1);
    expect(component.paisesFiltrados).toEqual([]);
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
    fixture.destroy();
  });

  it('conserva la selección y la navegación al detalle', () => {
    const fixture = create(4);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const seleccion = fixture.componentInstance.paises[0];
    fixture.nativeElement.querySelector('ul[aria-labelledby="paises-title"] a').click();
    expect(TestBed.inject(PaisDataService).setPais).toHaveBeenCalledWith(seleccion);
    expect(router.navigate).toHaveBeenCalledWith(['/pais']);
    fixture.destroy();
  });

  it('mantiene tarjetas y controles dentro del contenedor a distintos anchos y cantidades de páginas', async () => {
    const fixture = create(1201);
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    for (const count of [4, 13, 1201]) {
      fixture.componentInstance.paisesFiltrados = fixture.componentInstance.paises.slice(0, count);
      fixture.componentInstance.paginaActual = count > 13 ? fixture.componentInstance.totalPaginas : 1;
      fixture.detectChanges();
      for (const width of [320, 375, 768, 1024, 1440]) {
        const frame = document.createElement('iframe');
        frame.style.width = `${width}px`;
        frame.style.height = '600px';
        const loaded = new Promise<void>(resolve => { frame.onload = () => resolve(); });
        frame.srcdoc = `<style>${styles}\n*{transition:none!important;animation:none!important}</style>${fixture.nativeElement.outerHTML}`;
        document.body.appendChild(frame);
        try {
          await loaded;
          const doc = frame.contentDocument!;
          expect(doc.documentElement.scrollWidth).withContext(`${width}/${count}`).toBeLessThanOrEqual(width);
          const nav = doc.querySelector('nav');
          expect(!!nav).toBe(count > 12);
          if (nav) {
            const bounds = nav.getBoundingClientRect();
            const controls = Array.from(nav.children).map(element => element.getBoundingClientRect());
            for (const rect of controls) {
              expect(rect.left).toBeGreaterThanOrEqual(bounds.left);
              expect(rect.right).toBeLessThanOrEqual(bounds.right);
              expect(rect.bottom).toBeLessThanOrEqual(bounds.bottom);
            }
            const buttons = Array.from(nav.querySelectorAll('button'));
            for (const button of buttons) expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
            const [previous, next] = buttons.map(button => button.getBoundingClientRect());
            expect(previous.right).toBeLessThanOrEqual(next.left);
          }
        } finally { frame.remove(); }
      }
    }
    fixture.destroy();
  });
});