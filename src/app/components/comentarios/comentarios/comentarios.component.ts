import { PaisesService } from './../../../core/service/paises.service';
import { Usuario } from './../../../models/interface/usuario.interface';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComentariosService } from '../../../core/service/comentarios.service';
import { Comentario } from '../../../models/interface/pais.interface';
import { CiudadDataService } from '../../../core/service/ciudad-data.service';
import { PaisDataService } from '../../../core/service/pais-data.service';
import { IdUsuarioService } from '../../../core/service/id-usuario.service';
import { UsuariosService } from '../../../core/service/usuarios.service';
import { concatMap, Observable } from 'rxjs';
import { FeedbackService } from '../../../core/service/feedback.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './comentarios.component.html'
})
export class ComentariosComponent {

  @Output()
  emitirComentario: EventEmitter<Comentario> = new EventEmitter();

  fb = inject(FormBuilder);
  cs = inject(ComentariosService);
  cds = inject(CiudadDataService);
  paisesService = inject(PaisesService);

  formulario = this.fb.nonNullable.group({
    comentario: ['', [Validators.required, Validators.minLength(3)]]
  });

  paisDataService = inject(PaisDataService);
  pais$ = this.paisDataService.pais$;
  nombreCiudad = '';
  idPais = '';
  errorMessage = '';
  feedback = inject(FeedbackService);

  ngOnInit() {
    this.pais$.subscribe(pais => {
      if (pais) {
        this.idPais = pais.id || '';
      }
    });
  }

  idUser = inject(IdUsuarioService);
  userService = inject(UsuariosService);

  getCiudadActual() {
    this.cds.ciudad$.subscribe(ciudad => {
      return ciudad;
    });
  }

  agregarComentarioDb() {
    this.errorMessage = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const comentarioString = this.formulario.getRawValue().comentario.trim();

    if (comentarioString.length < 3) {
      this.errorMessage = 'mensajes.comentarioMinimo';
      return;
    }

    this.cds.ciudad$.subscribe(ciudad => {
      if (ciudad) {
        this.nombreCiudad = ciudad.nombre;
      }
    });

    if (!this.idPais || !this.nombreCiudad) {
      this.feedback.error('mensajes.obtenerPaisCiudad');
      return;
    }

    this.devolverUsuario().subscribe(usuarioActual => {
      const nuevoComentario: Comentario = {
        mensaje: comentarioString,
        ciudad: this.nombreCiudad,
        usuarioId: usuarioActual.id || '',
        usuario: usuarioActual.username
      };

      this.cs.postComentario(nuevoComentario).subscribe({
        next: (comentario) => {
          this.emitirComentario.emit(comentario);
          this.formulario.reset({ comentario: '' });
          this.errorMessage = '';
          this.feedback.success('mensajes.comentarioPublicado');
        },
        error: (error) => {
          this.feedback.error(error.message);
        }
      });
    });
  }

  devolverUsuario(): Observable<Usuario> {
    const id$ = this.idUser.id$;
    return id$.pipe(
      concatMap(id => {
        return this.userService.getUsuarioById(id);
      })
    );
  }
}
