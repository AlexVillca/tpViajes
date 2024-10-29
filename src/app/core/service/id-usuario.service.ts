import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IdUsuarioService {
  private id = new BehaviorSubject<string | null>(null);

  // Getter para exponer el Observable del ID
  get id$(): Observable<string | null> {
    return this.id.asObservable();
  }

  // Setter para actualizar el valor del ID
  setId(nuevoId: string | null): void {
    this.id.next(nuevoId);
  }
  clearUserId(){
    this.id.next(null);
  }
  constructor() { }
}
