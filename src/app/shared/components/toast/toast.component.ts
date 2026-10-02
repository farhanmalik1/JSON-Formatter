import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item"
        [class]="toast.type"
      >
        <app-icon
          [name]="toast.type === 'success' ? 'check' : toast.type === 'error' ? 'warning' : 'info'"
          [size]="18"
          [color]="toast.type === 'error' ? '#ffffff' : '#000000'"
        ></app-icon>
        <span class="toast-text">{{ toast.text }}</span>
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <app-icon name="x" [size]="12" [color]="toast.type === 'error' ? '#ffffff' : '#000000'"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      min-width: 280px;
      max-width: 440px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: 3px solid #000000;
      box-shadow: 4px 4px 0px #000000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      font-weight: 800;
      animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-item.success {
      background-color: var(--neo-green);
      color: #000000;
    }
    .toast-item.error {
      background-color: var(--neo-pink);
      color: #ffffff;
    }
    .toast-item.info {
      background-color: var(--neo-yellow);
      color: #000000;
    }
    .toast-item.warning {
      background-color: var(--neo-orange);
      color: #000000;
    }
    .toast-text {
      flex: 1;
      font-weight: 800;
    }
    .toast-close {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1.5px solid #000000;
      border-radius: 4px;
      background: transparent;
      box-shadow: 1px 1px 0px #000000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @keyframes popIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
