import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
}

/**
 * Guarda los datos visibles de la sesión (id, nombre y email) para la interfaz.
 * El token NO se guarda acá: el backend lo manda en una cookie httpOnly que el
 * JavaScript de la página no puede leer.
 */
@Injectable({
  providedIn: 'root'
})
export class IdUsuarioService {
  private readonly STORAGE_KEY = 'deruta_session';
  private readonly LEGACY_STORAGE_KEY = 'userId';
  // Versiones anteriores guardaban el token en localStorage; se borra si quedó.
  private readonly LEGACY_TOKEN_KEY = 'deruta_token';

  private readonly sessionSubject = new BehaviorSubject<SessionUser | null>(
    this.readStoredSession()
  );

  readonly session$ = this.sessionSubject.asObservable();

  constructor() {
    localStorage.removeItem(this.LEGACY_TOKEN_KEY);
  }

  get id$(): Observable<string | null> {
    return this.session$.pipe(map(session => session?.id ?? null));
  }

  get currentSession(): SessionUser | null {
    return this.sessionSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentSession !== null;
  }

  setSession(session: SessionUser): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(this.LEGACY_STORAGE_KEY, session.id);
    this.sessionSubject.next(session);
  }

  setId(nuevoId: string | null): void {
    if (!nuevoId) {
      this.clearUserId();
      return;
    }

    const current = this.currentSession;

    if (current?.id === nuevoId) {
      return;
    }

    this.setSession({
      id: nuevoId,
      username: current?.username ?? '',
      email: current?.email ?? ''
    });
  }

  clearUserId() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  private readStoredSession(): SessionUser | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);

    if (!raw) {
      const legacyId = localStorage.getItem(this.LEGACY_STORAGE_KEY);

      if (!legacyId) {
        return null;
      }

      return {
        id: legacyId,
        username: '',
        email: '',
      };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionUser>;

      if (!parsed.id) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      return {
        id: parsed.id,
        username: parsed.username ?? '',
        email: parsed.email ?? '',
      };
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
}
