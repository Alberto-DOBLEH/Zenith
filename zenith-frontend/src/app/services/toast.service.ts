import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public readonly toasts = signal<Toast[]>([]);

  public success(message: string): void {
    this.addToast(message, 'success');
  }

  public error(message: string): void {
    this.addToast(message, 'error');
  }

  private addToast(message: string, type: 'success' | 'error'): void {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  public removeToast(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
