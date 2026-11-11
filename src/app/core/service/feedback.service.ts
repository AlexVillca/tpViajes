import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackMessage {
  text: string;
  type: FeedbackType;
}

/**
 * Centraliza los mensajes de éxito/error/info de toda la app. Los componentes llaman a success()/error()
 * y el FeedbackToast los muestra; se ocultan solos después de unos segundos.
 */
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly messageSubject = new BehaviorSubject<FeedbackMessage | null>(null);
  readonly message$ = this.messageSubject.asObservable();

  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  show(text: string, type: FeedbackType = 'info', duration = 3000): void {
    this.clearTimeout();
    this.messageSubject.next({ text, type });

    this.hideTimeout = setTimeout(() => {
      this.clear();
    }, duration);
  }

  success(text: string, duration = 2500): void {
    this.show(text, 'success', duration);
  }

  error(text: string, duration = 4000): void {
    this.show(text, 'error', duration);
  }

  clear(): void {
    this.clearTimeout();
    this.messageSubject.next(null);
  }

  private clearTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
