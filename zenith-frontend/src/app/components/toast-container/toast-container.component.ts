import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg bg-white transition-all duration-300 animate-slide-in"
          [ngClass]="{
            'border-green-200 text-green-800 bg-green-50/90 backdrop-blur-sm': toast.type === 'success',
            'border-red-200 text-red-800 bg-red-50/90 backdrop-blur-sm': toast.type === 'error'
          }"
        >
          <div class="flex items-center gap-3">
            @if (toast.type === 'success') {
              <app-icon name="check" [size]="20" class="text-green-600"></app-icon>
            } @else {
              <app-icon name="x" [size]="20" class="text-red-600"></app-icon>
            }
            <span class="font-medium text-sm">{{ toast.message }}</span>
          </div>
          <button
            (click)="toastService.removeToast(toast.id)"
            class="ml-4 text-gray-400 hover:text-gray-600 transition"
          >
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-slide-in {
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastContainerComponent {
  public readonly toastService = inject(ToastService);
}
