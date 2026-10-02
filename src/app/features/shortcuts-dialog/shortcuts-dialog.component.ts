import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface ShortcutGroup {
  category: string;
  items: { key: string; description: string }[];
}

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="shortcuts-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-title">
            <app-icon name="keyboard" [size]="22" color="#000"></app-icon>
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button class="btn-icon btn-secondary" (click)="close()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <div *ngFor="let group of groups" class="shortcut-group">
            <h4 class="group-title">{{ group.category }}</h4>
            <div class="shortcuts-grid">
              <div *ngFor="let item of group.items" class="shortcut-row">
                <span class="shortcut-desc">{{ item.description }}</span>
                <kbd>{{ item.key }}</kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <span>Press <kbd>Esc</kbd> to close</span>
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
    .shortcuts-dialog {
      width: 100%;
      max-width: 620px;
      background-color: var(--bg-surface);
      border: 3px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-popup);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background-color: var(--neo-green);
      border-bottom: 3px solid var(--border-color);
      color: #000000;
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
      max-height: 480px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .group-title {
      font-size: 0.825rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .shortcuts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 14px;
    }
    .shortcut-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 2px 2px 0px var(--shadow-color);
      font-size: 0.825rem;
      font-weight: 700;
    }
    .shortcut-desc {
      color: var(--text-main);
    }
    .dialog-footer {
      padding: 12px 20px;
      border-top: 2px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main);
      background-color: var(--bg-surface-hover);
      text-align: right;
    }

    @media (max-width: 600px) {
      .shortcuts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ShortcutsDialogComponent {
  @Output() onClose = new EventEmitter<void>();

  groups: ShortcutGroup[] = [
    {
      category: 'General & Actions',
      items: [
        { key: 'Ctrl + K', description: 'Command Palette' },
        { key: 'Ctrl + Enter', description: 'Format / Prettify JSON' },
        { key: 'Ctrl + F', description: 'Search Keys / Values' },
        { key: 'Ctrl + S', description: 'Download JSON File' },
        { key: '?', description: 'Open Shortcuts Dialog' },
        { key: 'Esc', description: 'Close Dialogs / Search' }
      ]
    },
    {
      category: 'Tree Viewer Navigation',
      items: [
        { key: 'Ctrl + Shift + E', description: 'Expand All Nodes' },
        { key: 'Ctrl + Shift + C', description: 'Collapse All Nodes' },
        { key: 'Up / Down', description: 'Navigate Tree Rows' },
        { key: 'Right / Left', description: 'Expand / Collapse Node' },
        { key: 'Double Click', description: 'Inline Edit Key/Value' }
      ]
    }
  ];

  close() {
    this.onClose.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.close();
  }
}
