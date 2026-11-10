import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IdiomaService } from '../../../core/i18n/idioma.service';

/** Interruptor ES / EN: la perilla se desliza hacia el idioma activo. */
@Component({
  selector: 'app-selector-idioma',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './selector-idioma.component.html'
})
export class SelectorIdiomaComponent {
  readonly idioma = inject(IdiomaService);
}
