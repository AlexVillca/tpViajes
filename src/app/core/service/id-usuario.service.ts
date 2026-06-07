import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class IdUsuarioService {
  // Persistimos solo lo minimo necesario para reconstruir la sesion.
  private readonly STORAGE_KEY = 'deruta_session';

  // La app intenta restaurar sesion desde storage al iniciar.
  private readonly sessionSubject = new BehaviorSubject<SessionUser | null>(
    this.readStoredSession()
  );

  readonly session$ = this.sessionSubject.asObservable();

  get id$(): Observable<string | null> {
    return this.session$.pipe(map(session => session?.id ?? null));
  }

  get currentSession(): SessionUser | null {
    return this.sessionSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentSession !== null;
  }

  // Guarda sesion en memoria y storage.
  setSession(session: SessionUser): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  clearUserId() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  // Restaura sesion solo si el payload minimo es valido.
  private readStoredSession(): SessionUser | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionUser>;

      if (!parsed.id || !parsed.username || !parsed.email) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      return {
        id: parsed.id,
        username: parsed.username,
        email: parsed.email,
      };
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  constructor() { }
}
