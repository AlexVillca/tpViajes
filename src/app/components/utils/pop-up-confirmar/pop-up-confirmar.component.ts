import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogoDirective } from '../dialogo/dialogo.directive';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pop-up-confirmar',
  standalone: true,
  imports: [DialogoDirective, TranslatePipe],
  templateUrl: './pop-up-confirmar.component.html'
})
export class PopUpConfirmarComponent{
  /** Clave de traducción del texto a confirmar (o un texto ya armado). */
  @Input() texto = '';
  @Input() parametros: Record<string, unknown> = {};
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

}
