import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackMessage {
  text: string;
  type: FeedbackType;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  // Para esta primera version mostramos un unico mensaje global a la vez.
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

  info(text: string, duration = 3000): void {
    this.show(text, 'info', duration);
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
