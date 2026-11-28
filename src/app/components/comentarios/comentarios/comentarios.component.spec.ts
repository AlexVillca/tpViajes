import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ComentariosComponent } from './comentarios.component';
import { ComentariosService } from '../../../core/service/comentarios.service';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { PaisesService } from '../../../core/service/paises.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { FeedbackService } from '../../../core/service/feedback.service';
import { Comentario } from '../../../models/interface/pais.interface';
import { proveerTraducciones } from '../../../core/i18n/traducciones.providers';

describe('ComentariosComponent - publicar', () => {
  it('publica el comentario con el país de la ciudad', () => {
    const postComentario = jasmine.createSpy('postComentario').and.callFake((c: Comentario) => of({ ...c, id: '1' }));
    TestBed.configureTestingModule({
      imports: [ComentariosComponent],
      providers: [proveerTraducciones(),
        { provide: ComentariosService, useValue: { postComentario } },
        { provide: CiudadDataService, useValue: { ciudad$: new BehaviorSubject({ nombre: 'Córdoba' }) } },
        { provide: PaisDataService, useValue: { pais$: new BehaviorSubject({ id: 'es', nombre: 'España' }) } },
        { provide: PaisesService, useValue: {} },
        { provide: IdUsuarioService, useValue: { id$: of('cuenta-1') } },
        { provide: UsuariosService, useValue: { getUsuarioById: () => of({ id: 'cuenta-1', username: 'viajera', email: 'v@mail.com' }) } },
        { provide: FeedbackService, useValue: { success: () => {}, error: () => {} } }
      ]
    });
    const fixture = TestBed.createComponent(ComentariosComponent);
    fixture.detectChanges();

    fixture.componentInstance.formulario.setValue({ comentario: 'Hermosa ciudad' });
    fixture.componentInstance.agregarComentarioDb();

    expect(postComentario).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      mensaje: 'Hermosa ciudad', ciudad: 'Córdoba', paisId: 'es'
    }));
  });
});
