import { Component, inject } from '@angular/core';
import { IdUsuarioService } from '../../service/id-usuario.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ficha-user',
  standalone: true,
  imports: [RouterLink,CommonModule],
  templateUrl: './ficha-user.component.html',
  styleUrl: './ficha-user.component.css'
})

export class FichaUserComponent {
  idUsuarioService = inject(IdUsuarioService);
  session$ = this.idUsuarioService.session$;
}
