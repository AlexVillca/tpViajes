
import { CommonModule, provideNetlifyLoader } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../service/usuarios.service';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule,CommonModule,RouterModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  usuarioService = inject(UsuariosService);
  idUsuario = inject(IdUsuarioService);
  routerService = inject(Router);


   // Estado para controlar si se muestra el registro



  correoInput: string= '';
  contrInput: string = '';
   setCorreo(event:any){
      this.correoInput = event.target.value;
   }
   setContr(event:any){
    this.contrInput = event.target.value;
   }

  funRespuesta(){
    this.usuarioService.logUsuario(this.correoInput, this.contrInput).subscribe(id => {
      if(id){
        this.idUsuario.setId(id);
        this.routerService.navigate(['home']);
      }else{
        console.log("usuario no registrado funResp");
      }
    } );

  }


  }



