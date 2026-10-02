import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './features/header/header.component';
import { JsonEditorComponent } from './features/json-editor/json-editor.component';
import { JsonViewerComponent } from './features/json-viewer/json-viewer.component';
import { JsonStatsComponent } from './features/json-stats/json-stats.component';
import { JsonDiffComponent } from './features/json-diff/json-diff.component';
import { CommandPaletteComponent } from './features/command-palette/command-palette.component';
import { ShortcutsDialogComponent } from './features/shortcuts-dialog/shortcuts-dialog.component';
import { RecentModalComponent } from './features/recent-modal/recent-modal.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { JsonParserService } from './core/services/json-parser.service';
import { JsonFormatterService } from './core/services/json-formatter.service';
import { FileService } from './core/services/file.service';
import { JsonStorageService } from './core/services/json-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    JsonEditorComponent,
    JsonViewerComponent,
    JsonStatsComponent,
    JsonDiffComponent,
    CommandPaletteComponent,
    ShortcutsDialogComponent,
    RecentModalComponent,
    SettingsComponent,
    ToastComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Top Application Header -->
      <app-header
        [currentMode]="currentMode"
        (onModeChange)="currentMode = $event"
        (onOpenCommandPalette)="showCommandPalette = true"
        (onOpenShortcuts)="showShortcuts = true"
        (onOpenSettings)="showSettings = true"
        (onOpenRecents)="showRecents = true"
      ></app-header>

      <!-- Main Workspace -->
      <main class="workspace">
        <!-- Explorer View (Two Panels) -->
        <ng-container *ngIf="currentMode === 'view'">
          <!-- Mobile Tab Selector Bar -->
          <div class="mobile-tabs">
            <button
              class="tab-btn"
              [class.active]="activeMobileTab === 'input'"
              (click)="activeMobileTab = 'input'"
            >
              JSON Input
            </button>
            <button
              class="tab-btn"
              [class.active]="activeMobileTab === 'viewer'"
              (click)="activeMobileTab = 'viewer'"
            >
              Tree Explorer
            </button>
          </div>

          <!-- Desktop Two Panel Grid -->
          <div class="split-view">
            <div class="panel-left" [class.mobile-hidden]="activeMobileTab !== 'input'">
              <app-json-editor></app-json-editor>
            </div>
            <div class="panel-right" [class.mobile-hidden]="activeMobileTab !== 'viewer'">
              <app-json-viewer></app-json-viewer>
            </div>
          </div>
        </ng-container>

        <!-- Compare (Diff) View -->
        <ng-container *ngIf="currentMode === 'diff'">
          <app-json-diff></app-json-diff>
        </ng-container>
      </main>

      <!-- Bottom Status Bar -->
      <app-json-stats></app-json-stats>

      <!-- Modals & Overlays -->
      <app-command-palette
        *ngIf="showCommandPalette"
        (onClose)="showCommandPalette = false"
        (onOpenShortcuts)="showShortcuts = true"
        (onSetMode)="currentMode = $event"
      ></app-command-palette>

      <app-shortcuts-dialog
        *ngIf="showShortcuts"
        (onClose)="showShortcuts = false"
      ></app-shortcuts-dialog>

      <app-recent-modal
        *ngIf="showRecents"
        (onClose)="showRecents = false"
      ></app-recent-modal>

      <app-settings
        *ngIf="showSettings"
        (onClose)="showSettings = false"
      ></app-settings>

      <!-- Global Toast Feedback -->
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-app);
    }
    .workspace {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .split-view {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    .panel-left {
      border-right: 2px solid var(--border-color);
      height: 100%;
      overflow: hidden;
    }
    .panel-right {
      height: 100%;
      overflow: hidden;
    }

    .mobile-tabs {
      display: none;
      height: 40px;
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      padding: 0 8px;
      align-items: center;
      gap: 8px;
    }
    .tab-btn {
      flex: 1;
      height: 30px;
      font-size: 0.825rem;
      font-weight: 800;
      color: var(--text-main);
      border-radius: var(--radius-sm);
      border: 2px solid var(--border-color);
      background-color: var(--bg-surface);
    }
    .tab-btn.active {
      background-color: var(--neo-yellow);
      color: #000000;
      box-shadow: 2px 2px 0px #000000;
    }

    @media (max-width: 768px) {
      .split-view {
        grid-template-columns: 1fr;
      }
      .mobile-tabs {
        display: flex;
      }
      .mobile-hidden {
        display: none !important;
      }
    }
  `]
})
export class AppComponent {
  parserService = inject(JsonParserService);
  formatterService = inject(JsonFormatterService);
  fileService = inject(FileService);
  storageService = inject(JsonStorageService);

  currentMode: 'view' | 'diff' = 'view';
  activeMobileTab: 'input' | 'viewer' = 'viewer';

  showCommandPalette: boolean = false;
  showShortcuts: boolean = false;
  showRecents: boolean = false;
  showSettings: boolean = false;

  // Global Keyboard Shortcuts
  @HostListener('document:keydown', ['$event'])
  handleGlobalShortcuts(event: KeyboardEvent) {
    const isCmdOrCtrl = event.ctrlKey || event.metaKey;

    // Ctrl+K -> Command Palette
    if (isCmdOrCtrl && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.showCommandPalette = !this.showCommandPalette;
    }

    // Ctrl+Enter -> Format JSON
    if (isCmdOrCtrl && event.key === 'Enter') {
      event.preventDefault();
      const raw = this.parserService.rawJson();
      if (raw) {
        const formatted = this.formatterService.formatJson(raw, '2');
        this.parserService.setRawJson(formatted);
      }
    }

    // Ctrl+S -> Download JSON
    if (isCmdOrCtrl && event.key.toLowerCase() === 's') {
      event.preventDefault();
      const raw = this.parserService.rawJson();
      if (raw) {
        this.fileService.downloadJson(raw, 'data.json');
      }
    }

    // Ctrl+Shift+E -> Expand All
    if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      this.parserService.expandAll();
    }

    // Ctrl+Shift+C -> Collapse All
    if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.parserService.collapseAll();
    }

    // ? -> Keyboard shortcuts dialog
    if (event.key === '?' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
      event.preventDefault();
      this.showShortcuts = true;
    }
  }
}
