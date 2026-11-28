import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { RegisterComponent } from './register.component';
import { ErrorDatoEnUso, UsuariosService } from '../../service/usuarios.service';
import { Usuario } from '../../../models/interface/usuario.interface';
import { proveerTraducciones } from '../../i18n/traducciones.providers';

describe('RegisterComponent - doble clic', () => {
  let respuesta: Subject<Usuario>;
  let postUsuario: jasmine.Spy;

  function crear() {
    respuesta = new Subject<Usuario>();
    postUsuario = jasmine.createSpy('postUsuario').and.returnValue(respuesta);
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [proveerTraducciones(), provideRouter([]), { provide: UsuariosService, useValue: { postUsuario } }]
    });
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.formulario.setValue({ username: 'viajero', email: 'viajero@mail.com', password: 'clave-segura' });
    fixture.detectChanges();
    return fixture;
  }

  const boton = (el: HTMLElement) => el.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('desactiva el botón mientras se envía y no manda un segundo registro', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;

    boton(el).click();
    fixture.detectChanges();
    expect(boton(el).disabled).toBeTrue();

    // Un segundo envío mientras se espera la respuesta no hace otro pedido.
    fixture.componentInstance.onSubmit();
    expect(postUsuario).toHaveBeenCalledTimes(1);
  });

  it('vuelve a activar el botón si el registro falla, para poder corregir y reintentar', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;

    boton(el).click();
    respuesta.error(new ErrorDatoEnUso('email'));
    fixture.detectChanges();

    expect(boton(el).disabled).toBeFalse();
    expect(el.textContent).toContain('Correo electrónico en uso, intente con otro');
  });
});
