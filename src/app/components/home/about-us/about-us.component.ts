import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './about-us.component.html'
})
export class AboutUsComponent {

  integrantes = ['Facundo Ramallo', 'Manuel Ruggeri', 'Alex Villca', 'Andrés Chávez', 'Gustavo Iñegue'];

}
