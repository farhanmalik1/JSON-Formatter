import { Component, inject, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { JsonParserService } from '../../core/services/json-parser.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { PathBreadcrumbComponent } from '../path-breadcrumb/path-breadcrumb.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { JsonNodeRowComponent } from './json-node-row/json-node-row.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    ToolbarComponent,
    PathBreadcrumbComponent,
    SearchBarComponent,
    JsonNodeRowComponent,
    IconComponent
  ],
  template: `
    <div class="viewer-panel" tabindex="0">
      <!-- Toolbar -->
      <app-toolbar (onToggleSearch)="toggleSearch()"></app-toolbar>

      <!-- Path Breadcrumbs -->
      <app-path-breadcrumb></app-path-breadcrumb>

      <!-- Search Bar Overlay -->
      <app-search-bar *ngIf="showSearch"></app-search-bar>

      <!-- Main Tree View Container -->
      <div class="tree-viewport-container">
        <!-- Virtual Scrolling Viewport for ultra performance -->
        <cdk-virtual-scroll-viewport
          *ngIf="nodes.length > 0"
          itemSize="28"
          class="tree-viewport"
        >
          <app-json-node-row
            *cdkVirtualFor="let node of nodes; trackBy: trackByNodeId"
            [node]="node"
          ></app-json-node-row>
        </cdk-virtual-scroll-viewport>

        <!-- Empty State -->
        <div *ngIf="nodes.length === 0" class="empty-viewer">
          <div class="empty-box">
            <app-icon name="format" [size]="48" color="#64748b"></app-icon>
            <h3>Explore Your JSON</h3>
            <p>Paste JSON into the input editor or load sample data to inspect the hierarchical tree.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .viewer-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-panel);
      outline: none;
      position: relative;
    }
    .tree-viewport-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      background-color: var(--bg-editor);
    }
    .tree-viewport {
      width: 100%;
      height: 100%;
      padding: 8px 0;
    }
    .empty-viewer {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .empty-box {
      max-width: 360px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
    }
    .empty-box h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .empty-box p {
      font-size: 0.85rem;
      line-height: 1.5;
    }
  `]
})
export class JsonViewerComponent {
  parserService = inject(JsonParserService);

  showSearch: boolean = false;

  get nodes() {
    return this.parserService.flattenedNodes();
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  trackByNodeId(index: number, item: any): string {
    return item.id;
  }

  // Keyboard navigation inside Tree View
  @HostListener('keydown', ['$event'])
  handleKeyboardNav(event: KeyboardEvent) {
    const selectedId = this.parserService.selectedNodeId();
    const nodesList = this.nodes;
    if (!nodesList.length) return;

    const currentIdx = nodesList.findIndex(n => n.id === selectedId);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = Math.min(currentIdx + 1, nodesList.length - 1);
      this.parserService.selectNode(nodesList[nextIdx].id);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = Math.max(currentIdx - 1, 0);
      this.parserService.selectNode(nodesList[prevIdx].id);
    } else if (event.key === 'ArrowRight' && currentIdx >= 0) {
      const node = nodesList[currentIdx];
      if (node.type === 'object' || node.type === 'array') {
        if (!node.expanded) {
          this.parserService.toggleExpand(node.id);
        }
      }
    } else if (event.key === 'ArrowLeft' && currentIdx >= 0) {
      const node = nodesList[currentIdx];
      if (node.expanded) {
        this.parserService.toggleExpand(node.id);
      } else if (node.parentId) {
        this.parserService.selectNode(node.parentId);
      }
    }
  }
}
