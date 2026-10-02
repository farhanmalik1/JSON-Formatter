import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonParserService } from '../../core/services/json-parser.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface BreadcrumbPart {
  name: string;
  path: string;
}

@Component({
  selector: 'app-path-breadcrumb',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="path-bar">
      <div class="path-label">
        <app-icon name="code" [size]="14"></app-icon>
        <span>Path:</span>
      </div>

      <div class="breadcrumbs-list">
        <ng-container *ngFor="let part of breadcrumbs; let last = last">
          <button class="breadcrumb-item" [class.active]="last" (click)="selectPath(part.path)">
            {{ part.name }}
          </button>
          <span class="sep" *ngIf="!last">/</span>
        </ng-container>
        <span *ngIf="breadcrumbs.length === 0" class="empty-path">Select a node to inspect path</span>
      </div>

      <div class="path-actions" *ngIf="selectedNodeId">
        <button class="btn-xs btn-primary" (click)="copyPath()" [attr.data-tooltip]="'Copy JSON Path'">
          <app-icon name="copy" [size]="13" color="#000"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .path-bar {
      height: 36px;
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 8px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 700;
      overflow-x: auto;
      user-select: none;
    }
    .path-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-main);
      font-weight: 800;
      white-space: nowrap;
    }
    .breadcrumbs-list {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      overflow-x: auto;
      white-space: nowrap;
    }
    .breadcrumb-item {
      color: var(--text-main);
      font-size: 0.775rem;
      font-weight: 700;
      padding: 2px 6px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      box-shadow: 1px 1px 0px var(--shadow-color);
    }
    .breadcrumb-item:hover {
      background-color: var(--neo-yellow);
      color: #000000;
    }
    .breadcrumb-item.active {
      font-weight: 800;
      color: #000000;
      background-color: var(--neo-cyan);
    }
    .sep {
      color: var(--text-muted);
      font-weight: 800;
    }
    .empty-path {
      color: var(--text-dim);
      font-style: italic;
    }
    .path-actions {
      display: flex;
      align-items: center;
    }
    .btn-xs {
      width: 26px;
      height: 26px;
      padding: 0;
    }
  `]
})
export class PathBreadcrumbComponent {
  parserService = inject(JsonParserService);
  clipboardService = inject(ClipboardService);

  get selectedNodeId(): string | null {
    return this.parserService.selectedNodeId();
  }

  get breadcrumbs(): BreadcrumbPart[] {
    const id = this.selectedNodeId;
    if (!id) return [];

    const node = this.parserService.nodesMap().get(id);
    if (!node) return [];

    const path = node.path;
    const parts: BreadcrumbPart[] = [];
    const tokens = path.replace(/^\$\.?/, '').split(/\.|\b(?=\[)/).filter(Boolean);

    parts.push({ name: '$', path: '$' });

    let currentPath = '$';
    for (const token of tokens) {
      if (token.startsWith('[')) {
        currentPath = `${currentPath}${token}`;
      } else {
        currentPath = currentPath === '$' ? `$.${token}` : `${currentPath}.${token}`;
      }
      parts.push({ name: token, path: currentPath });
    }

    return parts;
  }

  selectPath(path: string) {
    this.parserService.selectNode(path);
  }

  copyPath() {
    const id = this.selectedNodeId;
    if (id) {
      const node = this.parserService.nodesMap().get(id);
      if (node) {
        this.clipboardService.copyText(node.path, `Path "${node.path}" copied`);
      }
    }
  }
}
