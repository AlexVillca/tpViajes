import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { UpdatePasswordComponent } from './update-password.component';
import { UsuariosService } from '../../service/usuarios.service';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { of } from 'rxjs';

describe('UpdatePasswordComponent - regreso', () => {
  it('vuelve a Perfil sin enviar el formulario ni cambiar la contraseña', () => {
    const usuarios = jasmine.createSpyObj<UsuariosService>('UsuariosService', ['cambiarContrasena']);
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: UsuariosService, useValue: usuarios },
      { provide: IdUsuarioService, useValue: { id$: of('cuenta') } }
    ] });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const component = TestBed.runInInjectionContext(() => new UpdatePasswordComponent());
    component.volver();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/fichaUser');
    expect(usuarios.cambiarContrasena).not.toHaveBeenCalled();
    expect(component.formularioUpdate.invalid).toBeTrue();
  });
});