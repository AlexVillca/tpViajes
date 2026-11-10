import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogoDirective } from '../dialogo/dialogo.directive';

@Component({
  selector: 'app-pop-up-confirmar',
  standalone: true,
  imports: [DialogoDirective],
  templateUrl: './pop-up-confirmar.component.html'
})
export class PopUpConfirmarComponent{
  @Input() texto = '';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

}
