import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="settings-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-title">
            <app-icon name="settings" [size]="22" color="#fff"></app-icon>
            <h3>Settings</h3>
          </div>
          <button class="btn-icon btn-secondary" (click)="close()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <!-- Theme Setting -->
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Theme Mode</span>
              <span class="setting-desc">Choose application interface theme</span>
            </div>
            <select [ngModel]="themeService.theme()" (ngModelChange)="setTheme($event)" class="setting-select">
              <option value="dark">Dark Neo Theme</option>
              <option value="light">Light Neo Theme</option>
              <option value="system">System Preference</option>
            </select>
          </div>

          <!-- Privacy Assurance Card -->
          <div class="privacy-box">
            <app-icon name="check" [size]="22" color="#000"></app-icon>
            <div class="privacy-text">
              <h4>100% Client-Side Privacy</h4>
              <p>Your JSON documents are processed completely inside your browser sandbox. No data is sent to external servers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .settings-dialog {
      width: 100%;
      max-width: 500px;
      background-color: var(--bg-surface);
      border: 3px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-popup);
      overflow: hidden;
      animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background-color: var(--neo-pink);
      border-bottom: 3px solid var(--border-color);
      color: #ffffff;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-title h3 {
      font-size: 1.15rem;
      font-weight: 800;
    }
    .dialog-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .setting-info {
      display: flex;
      flex-direction: column;
    }
    .setting-label {
      font-weight: 800;
      font-size: 0.9rem;
    }
    .setting-desc {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .setting-select {
      height: 36px;
      font-size: 0.825rem;
      font-weight: 700;
      border: 2px solid var(--border-color);
    }

    .privacy-box {
      margin-top: 6px;
      padding: 14px;
      background-color: var(--neo-green);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 3px 3px 0px var(--shadow-color);
      color: #000000;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .privacy-text h4 {
      font-size: 0.9rem;
      font-weight: 800;
      margin-bottom: 3px;
    }
    .privacy-text p {
      font-size: 0.775rem;
      font-weight: 600;
      line-height: 1.4;
    }
  `]
})
export class SettingsComponent {
  themeService = inject(ThemeService);

  @Output() onClose = new EventEmitter<void>();

  setTheme(mode: ThemeMode) {
    this.themeService.setTheme(mode);
  }

  close() {
    this.onClose.emit();
  }
}
