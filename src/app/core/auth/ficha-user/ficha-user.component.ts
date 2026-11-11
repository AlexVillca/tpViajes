import { Component, inject } from '@angular/core';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/** Ficha del usuario: muestra los datos de la cuenta y los accesos a editar perfil, favoritos y cambiar contraseña. */
@Component({
  selector: 'app-ficha-user',
  standalone: true,
  imports: [RouterLink,CommonModule, TranslatePipe],
  templateUrl: './ficha-user.component.html'
})

export class FichaUserComponent {
  idUsuarioService = inject(IdUsuarioService);
  session$ = this.idUsuarioService.session$;
}
