import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="app-header">
      <!-- Left: Logo & Title -->
      <div class="header-left">
        <div class="logo-box">
          <app-icon name="format" [size]="20" color="#000000"></app-icon>
        </div>
        <div class="title-group">
          <div class="app-title-row">
            <h1 class="app-name">JSON Viewer</h1>
            <span class="version-badge">NEO</span>
          </div>
          <span class="app-subtitle">Explore & format JSON with ease</span>
        </div>
      </div>

      <!-- Center: Mode Switch (Explorer vs Diff) -->
      <div class="header-center">
        <div class="mode-switch">
          <button
            class="mode-btn mode-explorer"
            [class.active]="currentMode === 'view'"
            (click)="onModeChange.emit('view')"
          >
            <app-icon name="format" [size]="14"></app-icon>
            Explorer
          </button>
          <button
            class="mode-btn mode-diff"
            [class.active]="currentMode === 'diff'"
            (click)="onModeChange.emit('diff')"
          >
            <app-icon name="diff" [size]="14"></app-icon>
            Compare (Diff)
          </button>
        </div>
      </div>

      <!-- Right: Action Icons & Controls -->
      <div class="header-right">
        <!-- Command Palette Trigger -->
        <button
          class="cmd-palette-btn"
          (click)="onOpenCommandPalette.emit()"
          [attr.data-tooltip]="'Command Palette (Ctrl+K)'"
        >
          <app-icon name="command" [size]="14"></app-icon>
          <span class="cmd-text">Commands</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div class="divider"></div>

        <!-- Recent JSONs -->
        <button
          class="btn-icon btn-cyan"
          (click)="onOpenRecents.emit()"
          [attr.data-tooltip]="'Recent Documents'"
        >
          <app-icon name="clock" [size]="18" color="#000"></app-icon>
        </button>

        <!-- Shortcuts Modal -->
        <button
          class="btn-icon btn-green"
          (click)="onOpenShortcuts.emit()"
          [attr.data-tooltip]="'Keyboard Shortcuts (?)'"
        >
          <app-icon name="keyboard" [size]="18" color="#000"></app-icon>
        </button>

        <!-- Theme Toggle Button -->
        <button
          class="btn-icon btn-primary"
          (click)="toggleTheme()"
          [attr.data-tooltip]="'Theme: ' + themeService.theme()"
        >
          <app-icon
            [name]="themeService.theme() === 'dark' ? 'moon' : themeService.theme() === 'light' ? 'sun' : 'monitor'"
            [size]="18"
            color="#000"
          ></app-icon>
        </button>

        <!-- Settings -->
        <button
          class="btn-icon btn-pink"
          (click)="onOpenSettings.emit()"
          [attr.data-tooltip]="'Settings'"
        >
          <app-icon name="settings" [size]="18" color="#fff"></app-icon>
        </button>

        <!-- GitHub Placeholder -->
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-icon-link"
          [attr.data-tooltip]="'Source Code on GitHub'"
        >
          <app-icon name="github" [size]="18"></app-icon>
        </a>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      background-color: var(--bg-surface);
      border-bottom: 3px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      user-select: none;
      box-shadow: 0 4px 0px rgba(0, 0, 0, 0.1);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: var(--neo-yellow);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-xs);
    }
    .title-group {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .app-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .app-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
    }
    .version-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--neo-cyan);
      color: #000000;
      border: 2px solid var(--border-color);
      box-shadow: 2px 2px 0px var(--shadow-color);
    }
    .app-subtitle {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .header-center {
      display: flex;
      align-items: center;
    }
    .mode-switch {
      display: flex;
      gap: 6px;
    }
    .mode-btn {
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      font-weight: 800;
      border: 2px solid var(--border-color);
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-xs);
    }
    .mode-btn.active.mode-explorer {
      background-color: var(--neo-yellow);
      color: #000000;
      box-shadow: var(--shadow-sm);
    }
    .mode-btn.active.mode-diff {
      background-color: var(--neo-pink);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cmd-palette-btn {
      height: 36px;
      padding: 0 12px;
      background-color: var(--neo-purple);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #000000;
      font-size: 0.8rem;
      font-weight: 700;
      gap: 8px;
      box-shadow: var(--shadow-xs);
    }
    .cmd-palette-btn:hover {
      box-shadow: var(--shadow-sm);
    }

    .btn-icon-link {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-xs);
      color: var(--text-main);
    }
    .btn-icon-link:hover {
      transform: translate(-1px, -1px);
      box-shadow: var(--shadow-sm);
    }

    .divider {
      width: 2px;
      height: 24px;
      background-color: var(--border-color);
      margin: 0 4px;
    }

    @media (max-width: 800px) {
      .app-subtitle, .cmd-text, kbd, .version-badge {
        display: none;
      }
      .app-header {
        padding: 0 8px;
      }
    }
  `]
})
export class HeaderComponent {
  themeService = inject(ThemeService);

  @Input() currentMode: 'view' | 'diff' = 'view';
  @Output() onModeChange = new EventEmitter<'view' | 'diff'>();
  @Output() onOpenCommandPalette = new EventEmitter<void>();
  @Output() onOpenShortcuts = new EventEmitter<void>();
  @Output() onOpenSettings = new EventEmitter<void>();
  @Output() onOpenRecents = new EventEmitter<void>();

  toggleTheme() {
    const current = this.themeService.theme();
    const nextTheme: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    this.themeService.setTheme(nextTheme);
  }
}
