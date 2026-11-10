import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  host: { class: 'block shrink-0' }
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
}
