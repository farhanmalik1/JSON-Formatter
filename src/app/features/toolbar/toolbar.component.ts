import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonParserService } from '../../core/services/json-parser.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { FileService } from '../../core/services/file.service';
import { FilterType } from '../../core/models/json-node.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="viewer-toolbar">
      <!-- Left Controls: Expand/Collapse/Depth -->
      <div class="toolbar-group">
        <button class="btn-sm btn-primary" (click)="parserService.expandAll()" [attr.data-tooltip]="'Expand All (Ctrl+Shift+E)'">
          <app-icon name="expand-all" [size]="14" color="#000"></app-icon>
          <span class="btn-label">Expand All</span>
        </button>

        <button class="btn-sm btn-pink" (click)="parserService.collapseAll()" [attr.data-tooltip]="'Collapse All (Ctrl+Shift+C)'">
          <app-icon name="collapse-all" [size]="14" color="#fff"></app-icon>
          <span class="btn-label">Collapse All</span>
        </button>

        <div class="depth-selector">
          <span class="depth-label">Depth:</span>
          <button
            *ngFor="let level of [1, 2, 3, 4, 5]"
            class="depth-btn"
            (click)="parserService.expandToDepth(level)"
            [attr.data-tooltip]="'Expand to Depth ' + level"
          >
            {{ level }}
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Center Controls: Search & Filter -->
      <div class="toolbar-group">
        <!-- Search Toggle -->
        <button
          class="btn-sm btn-cyan"
          [class.active]="showSearch"
          (click)="onToggleSearch.emit()"
          [attr.data-tooltip]="'Toggle Search Bar (Ctrl+F)'"
        >
          <app-icon name="search" [size]="14" color="#000"></app-icon>
          <span class="btn-label">Search</span>
        </button>

        <!-- Filter Dropdown -->
        <div class="filter-dropdown">
          <app-icon name="filter" [size]="14" class="filter-icon"></app-icon>
          <select [ngModel]="parserService.filterType()" (ngModelChange)="onFilterChange($event)" class="filter-select">
            <option value="all">All Types</option>
            <option value="object">Objects only</option>
            <option value="array">Arrays only</option>
            <option value="string">Strings only</option>
            <option value="number">Numbers only</option>
            <option value="boolean">Booleans only</option>
            <option value="null">Nulls only</option>
          </select>
        </div>
      </div>

      <!-- Right Controls: Copy & Download -->
      <div class="toolbar-group right">
        <button class="btn-sm btn-secondary" (click)="copyFormattedJson()" [attr.data-tooltip]="'Copy Formatted JSON'">
          <app-icon name="copy" [size]="14"></app-icon>
          <span class="btn-label">Copy JSON</span>
        </button>

        <button class="btn-sm btn-green" (click)="downloadJson()" [attr.data-tooltip]="'Download JSON File (Ctrl+S)'">
          <app-icon name="download" [size]="14" color="#000"></app-icon>
          <span class="btn-label">Download</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .viewer-toolbar {
      height: var(--toolbar-height);
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      user-select: none;
      gap: 8px;
      overflow-x: auto;
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .toolbar-group.right {
      margin-left: auto;
    }
    .divider {
      width: 2px;
      height: 20px;
      background-color: var(--border-color);
      margin: 0 2px;
    }
    .depth-selector {
      display: flex;
      align-items: center;
      gap: 3px;
      background-color: var(--bg-surface-hover);
      padding: 3px 6px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-xs);
    }
    .depth-label {
      font-size: 0.75rem;
      color: var(--text-main);
      font-weight: 800;
      margin-right: 2px;
    }
    .depth-btn {
      width: 22px;
      height: 22px;
      padding: 0;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 800;
      color: #000000;
      background-color: var(--neo-yellow);
      border: 1px solid var(--border-color);
      box-shadow: 1px 1px 0px var(--shadow-color);
    }
    .depth-btn:hover {
      background-color: #fde047;
      transform: scale(1.05);
    }
    .filter-dropdown {
      position: relative;
      display: flex;
      align-items: center;
    }
    .filter-icon {
      position: absolute;
      left: 10px;
      color: var(--text-main);
      pointer-events: none;
    }
    .filter-select {
      height: 32px;
      padding-left: 30px;
      padding-right: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 2px solid var(--border-color);
    }

    @media (max-width: 900px) {
      .btn-label, .depth-label {
        display: none;
      }
    }
  `]
})
export class ToolbarComponent {
  parserService = inject(JsonParserService);
  clipboardService = inject(ClipboardService);
  fileService = inject(FileService);

  @Output() onToggleSearch = new EventEmitter<void>();
  showSearch: boolean = false;

  onFilterChange(type: FilterType) {
    this.parserService.filterType.set(type);
  }

  copyFormattedJson() {
    const raw = this.parserService.rawJson();
    if (raw) {
      this.clipboardService.copyText(raw, 'JSON copied to clipboard');
    }
  }

  downloadJson() {
    const raw = this.parserService.rawJson();
    if (raw) {
      this.fileService.downloadJson(raw, 'data.json');
    }
  }
}
