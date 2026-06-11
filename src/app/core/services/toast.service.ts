import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'danger' | 'warning' | 'info';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  show(text: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success', duration = 4000) {
    const id = this.nextId++;
    const newToast: ToastMessage = { id, type, text };
    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  danger(text: string) {
    this.show(text, 'danger', 5000);
  }

  warning(text: string) {
    this.show(text, 'warning', 4000);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
