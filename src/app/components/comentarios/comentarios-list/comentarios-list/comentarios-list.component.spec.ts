import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ComentariosListComponent } from './comentarios-list.component';
import { ComentariosService } from '../../../../core/service/comentarios.service';
import { CiudadDataService } from '../../../../core/service/ciudad-data.service';
import { IdUsuarioService } from '../../../../core/service/id-usuario.service';
import { Comentario } from '../../../../models/interface/pais.interface';

describe('ComentariosListComponent - paginación', () => {
  const comentarios: Comentario[] = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1), mensaje: `Comentario ${i + 1}`, ciudad: 'Fez', usuarioId: '9', usuario: 'otra'
  }));

  function crear(lista: Comentario[] = comentarios) {
    TestBed.configureTestingModule({
      imports: [ComentariosListComponent],
      providers: [
        { provide: ComentariosService, useValue: { getComentarios: () => of(lista) } },
        { provide: CiudadDataService, useValue: { ciudad$: new BehaviorSubject({ nombre: 'Fez' }) } },
        { provide: IdUsuarioService, useValue: { id$: of(null) } }
      ]
    });
    const fixture = TestBed.createComponent(ComentariosListComponent);
    fixture.detectChanges();
    return fixture;
  }

  const textos = (el: HTMLElement) => Array.from(el.querySelectorAll('li')).map(li => li.textContent?.trim());

  it('muestra 5 comentarios por página, del más nuevo al más viejo', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('li').length).toBe(5);
    expect(textos(el)[0]).toContain('Comentario 12');
    expect(el.querySelector('nav')?.textContent).toContain('Página 1 de 3');

    fixture.componentInstance.paginaSiguiente();
    fixture.componentInstance.paginaSiguiente();
    fixture.detectChanges();
    expect(el.querySelectorAll('li').length).toBe(2);
    expect(textos(el)).toEqual([jasmine.stringContaining('Comentario 2'), jasmine.stringContaining('Comentario 1')]);
  });

  it('vuelve a la primera página al publicar un comentario nuevo', () => {
    const fixture = crear();
    const componente = fixture.componentInstance;
    componente.paginaSiguiente();

    componente.agregarComentarioDb({ id: '13', mensaje: 'Recién publicado', ciudad: 'Fez', usuarioId: '9', usuario: 'otra' });
    fixture.detectChanges();

    expect(componente.paginaActual).toBe(1);
    expect(textos(fixture.nativeElement)[0]).toContain('Recién publicado');
  });

  it('no muestra la paginación cuando entran en una sola página', () => {
    const fixture = crear(comentarios.slice(0, 5));
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });
});
