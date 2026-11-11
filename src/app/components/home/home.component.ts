import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Portada de bienvenida, con el acceso para empezar a explorar el mundo. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, TranslatePipe],
  templateUrl: './home.component.html'
})
export class HomeComponent {}
