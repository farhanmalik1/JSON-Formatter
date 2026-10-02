import { Component, inject, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonParserService } from '../../core/services/json-parser.service';
import { JsonFormatterService } from '../../core/services/json-formatter.service';
import { ThemeService } from '../../core/services/theme.service';
import { FileService } from '../../core/services/file.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="palette-dialog" (click)="$event.stopPropagation()">
        <!-- Search Input -->
        <div class="palette-header">
          <app-icon name="search" [size]="20" class="search-icon" color="#000000"></app-icon>
          <input
            #searchInput
            type="text"
            class="palette-input"
            placeholder="Type a command or search..."
            [(ngModel)]="query"
            (keydown.arrowdown)="moveSelection(1)"
            (keydown.arrowup)="moveSelection(-1)"
            (keydown.enter)="executeSelected()"
            (keydown.escape)="close()"
          />
          <kbd>Esc</kbd>
        </div>

        <!-- Commands List -->
        <div class="palette-list">
          <div
            *ngFor="let item of filteredCommands; let i = index"
            class="command-row"
            [class.selected]="i === selectedIndex"
            (click)="runCommand(item)"
          >
            <app-icon [name]="item.icon" [size]="18" class="cmd-icon"></app-icon>
            <div class="cmd-info">
              <span class="cmd-title">{{ item.title }}</span>
              <span class="cmd-sub" *ngIf="item.subtitle">{{ item.subtitle }}</span>
            </div>
            <kbd *ngIf="item.shortcut">{{ item.shortcut }}</kbd>
          </div>

          <div *ngIf="filteredCommands.length === 0" class="no-results">
            No matching commands found
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 80px;
    }
    .palette-dialog {
      width: 100%;
      max-width: 600px;
      background-color: var(--bg-surface);
      border: 3px solid #000000;
      border-radius: var(--radius-lg);
      box-shadow: 8px 8px 0px #000000;
      overflow: hidden;
      animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .palette-header {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 3px solid #000000;
      background-color: var(--neo-yellow);
      gap: 12px;
    }
    .palette-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 1.05rem;
      font-weight: 800;
      color: #000000;
      box-shadow: none !important;
    }
    .palette-input::placeholder {
      color: #27272a;
    }
    .palette-list {
      max-height: 360px;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: var(--bg-panel);
    }
    .command-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border-color);
      background-color: var(--bg-surface);
      box-shadow: 2px 2px 0px var(--shadow-color);
      cursor: pointer;
      user-select: none;
      color: var(--text-main);
    }
    .cmd-icon {
      color: var(--neo-cyan);
      display: flex;
      align-items: center;
    }
    .command-row:hover, .command-row.selected {
      background-color: var(--neo-cyan) !important;
      color: #000000 !important;
      border-color: #000000 !important;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0px #000000 !important;
    }
    .command-row:hover .cmd-icon,
    .command-row.selected .cmd-icon,
    .command-row:hover .cmd-title,
    .command-row.selected .cmd-title,
    .command-row:hover .cmd-sub,
    .command-row.selected .cmd-sub {
      color: #000000 !important;
    }
    .cmd-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .cmd-title {
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .cmd-sub {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .no-results {
      padding: 24px;
      text-align: center;
      font-weight: 800;
      color: var(--text-muted);
    }

    @keyframes popIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class CommandPaletteComponent {
  parserService = inject(JsonParserService);
  formatterService = inject(JsonFormatterService);
  themeService = inject(ThemeService);
  fileService = inject(FileService);
  clipboardService = inject(ClipboardService);

  @Output() onClose = new EventEmitter<void>();
  @Output() onOpenShortcuts = new EventEmitter<void>();
  @Output() onSetMode = new EventEmitter<'view' | 'diff'>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  query: string = '';
  selectedIndex: number = 0;

  commands: CommandItem[] = [];

  ngOnInit() {
    this.commands = [
      {
        id: 'format',
        title: 'Format JSON',
        subtitle: 'Prettify and format input JSON data',
        icon: 'format',
        shortcut: 'Ctrl+Enter',
        action: () => {
          const raw = this.parserService.rawJson();
          if (raw) {
            const formatted = this.formatterService.formatJson(raw, '2');
            this.parserService.setRawJson(formatted);
          }
        }
      },
      {
        id: 'minify',
        title: 'Minify JSON',
        subtitle: 'Remove white spaces and format into compact single line',
        icon: 'minify',
        action: () => {
          const raw = this.parserService.rawJson();
          if (raw) {
            const minified = this.formatterService.minifyJson(raw);
            this.parserService.setRawJson(minified);
          }
        }
      },
      {
        id: 'expand-all',
        title: 'Expand All Nodes',
        subtitle: 'Expand every tree level in JSON viewer',
        icon: 'expand-all',
        shortcut: 'Ctrl+Shift+E',
        action: () => this.parserService.expandAll()
      },
      {
        id: 'collapse-all',
        title: 'Collapse All Nodes',
        subtitle: 'Collapse all tree levels',
        icon: 'collapse-all',
        shortcut: 'Ctrl+Shift+C',
        action: () => this.parserService.collapseAll()
      },
      {
        id: 'download',
        title: 'Download JSON',
        subtitle: 'Export current JSON to data.json file',
        icon: 'download',
        shortcut: 'Ctrl+S',
        action: () => {
          const raw = this.parserService.rawJson();
          if (raw) this.fileService.downloadJson(raw, 'data.json');
        }
      },
      {
        id: 'copy',
        title: 'Copy Formatted JSON',
        subtitle: 'Copy JSON contents to clipboard',
        icon: 'copy',
        action: () => {
          const raw = this.parserService.rawJson();
          if (raw) this.clipboardService.copyText(raw, 'JSON copied to clipboard');
        }
      },
      {
        id: 'compare-mode',
        title: 'Compare JSON (Diff)',
        subtitle: 'Side-by-side JSON document compare mode',
        icon: 'diff',
        action: () => this.onSetMode.emit('diff')
      },
      {
        id: 'toggle-theme',
        title: 'Toggle Theme Mode',
        subtitle: 'Switch theme between Light, Dark, and System',
        icon: 'moon',
        action: () => {
          const t = this.themeService.theme();
          this.themeService.setTheme(t === 'dark' ? 'light' : 'dark');
        }
      },
      {
        id: 'shortcuts',
        title: 'Keyboard Shortcuts Cheat Sheet',
        subtitle: 'View all keyboard shortcuts and commands',
        icon: 'keyboard',
        shortcut: '?',
        action: () => this.onOpenShortcuts.emit()
      }
    ];

    setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
  }

  get filteredCommands(): CommandItem[] {
    const q = this.query.toLowerCase().trim();
    if (!q) return this.commands;
    return this.commands.filter(
      c => c.title.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }

  moveSelection(delta: number) {
    const max = this.filteredCommands.length;
    if (max === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + max) % max;
  }

  executeSelected() {
    const items = this.filteredCommands;
    if (items[this.selectedIndex]) {
      this.runCommand(items[this.selectedIndex]);
    }
  }

  runCommand(item: CommandItem) {
    item.action();
    this.close();
  }

  close() {
    this.onClose.emit();
  }
}
