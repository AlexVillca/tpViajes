import { PaisesService } from './../../../core/service/paises.service';
import { Ciudad } from './../../../models/interface/pais.interface';
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
import { catchError, concatMap, Observable, throwError } from 'rxjs';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule], 
  templateUrl: './comentarios.component.html',
  styleUrl: './comentarios.component.css'
})
export class ComentariosComponent {
  
  @Output()
  emitirComentario: EventEmitter<Comentario> = new EventEmitter();

  fb = inject(FormBuilder);
  cs = inject(ComentariosService); 
  cds = inject(CiudadDataService);
  paisesService = inject(PaisesService);


  formulario = this.fb.nonNullable.group( // no aceptará nulos
    {
      comentario: ['', [Validators.required,Validators.minLength(3)]]
    }
  )

  paisDataService = inject(PaisDataService);
  pais$ = this.paisDataService.pais$; 
  nombreCiudad = ''; 
  idPais: string = '';

  // Esto es asincrónico y se actualiza el valor de idPais cuando pais$ emite un nuevo valor.
  ngOnInit() {
    this.pais$.subscribe(pais => {
      if (pais) {
        this.idPais = pais.id || ''; // Asigna el id cuando el observable emita datos
      }
    });
  }

  idUser = inject(IdUsuarioService);
  userService=inject(UsuariosService);

  getCiudadActual(){

    this.cds.ciudad$.subscribe(ciudad => {
      return ciudad;
    })
    
  }
  agregarComentarioDb() {
    if (this.formulario.invalid) return alert("Formulario inválido");
  
    const comentarioString = this.formulario.getRawValue().comentario;
  
    this.cds.ciudad$.subscribe(ciudad => {
      if (ciudad) {
        this.nombreCiudad = ciudad.nombre;
      }
    }); /// Guardar valor ciudad
  
    if (!this.idPais || !this.nombreCiudad) {
      return alert('No se pudo obtener el país o la ciudad');
    }
  
    // Aquí utilizamos el observable de devolverUsuario
    this.devolverUsuario().subscribe(usuarioActual => {
      const nuevoComentario : Comentario = {
       mensaje: comentarioString,
       ciudad: this.nombreCiudad,
       usuarioId: usuarioActual.id || '',
       usuario: usuarioActual.username
      };
  
      console.log(nuevoComentario)
      
      
      this.cs.postComentario(nuevoComentario).subscribe({
        next: (comentario) => {
          this.emitirComentario.emit(comentario);
          this.formulario.reset();
        },
        error: (error) => {
          console.error(error);
        }
      });
    })
  }
  
  devolverUsuario(): Observable<Usuario> {
    const id$ = this.idUser.id$;
    return id$.pipe(
      concatMap(id => {
        // Devuelve el Observable de getUsuarioById
        return this.userService.getUsuarioById(id);
      })
    );
  }
  
}
