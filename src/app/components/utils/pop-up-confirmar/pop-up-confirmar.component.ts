import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pop-up-confirmar',
  standalone: true,
  imports: [],
  templateUrl: './pop-up-confirmar.component.html',
  styleUrl: './pop-up-confirmar.component.css'
})
export class PopUpConfirmarComponent{
  @Input() texto = '';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();



}
