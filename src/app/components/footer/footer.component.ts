import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, TranslatePipe],
  templateUrl: './footer.component.html',
  host: { class: 'block shrink-0' }
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
}
