import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonDiffService } from '../../core/services/json-diff.service';
import { JsonParserService } from '../../core/services/json-parser.service';
import { JsonFormatterService } from '../../core/services/json-formatter.service';
import { FileService } from '../../core/services/file.service';
import { AlignedDiffRow, DiffItem } from '../../core/models/json-node.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-json-diff',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="diff-container">
      <!-- Diff Control Bar -->
      <div class="diff-bar">
        <!-- Diff Summary Badges -->
        <div class="diff-summary" *ngIf="stats">
          <span class="badge added" [attr.data-tooltip]="'Fields added in Document B'">+ {{ stats.added }} Added</span>
          <span class="badge removed" [attr.data-tooltip]="'Fields removed from Document B'">- {{ stats.removed }} Removed</span>
          <span class="badge modified" [attr.data-tooltip]="'Fields with modified values'">~ {{ stats.modified }} Changed</span>
          <span class="badge unchanged" [attr.data-tooltip]="'Identical fields'">{{ stats.unchanged }} Unchanged</span>
        </div>

        <!-- Mode & Filter Controls -->
        <div class="diff-controls">
          <!-- View Type Switcher -->
          <div class="view-type-switch">
            <button
              class="switch-btn"
              [class.active]="viewType === 'side-by-side-tree'"
              (click)="setViewType('side-by-side-tree')"
              [attr.data-tooltip]="'Side-by-side aligned interactive tree comparison'"
            >
              <app-icon name="folder" [size]="14" [color]="viewType === 'side-by-side-tree' ? '#000' : 'currentColor'"></app-icon>
              Side-by-Side Tree
            </button>
            <button
              class="switch-btn"
              [class.active]="viewType === 'side-by-side-code'"
              (click)="setViewType('side-by-side-code')"
              [attr.data-tooltip]="'Side-by-side code editor text diff'"
            >
              <app-icon name="copy" [size]="14" [color]="viewType === 'side-by-side-code' ? '#000' : 'currentColor'"></app-icon>
              Side-by-Side Code
            </button>
            <button
              class="switch-btn"
              [class.active]="viewType === 'unified'"
              (click)="setViewType('unified')"
              [attr.data-tooltip]="'Unified linear list of changes'"
            >
              <app-icon name="list" [size]="14" [color]="viewType === 'unified' ? '#000' : 'currentColor'"></app-icon>
              Unified List
            </button>
          </div>

          <!-- Diff Filter Toggle -->
          <button
            *ngIf="viewType === 'side-by-side-tree'"
            class="btn-sm btn-filter"
            [class.active]="onlyChanges"
            (click)="toggleOnlyChanges()"
          >
            {{ onlyChanges ? 'Showing: Only Changes' : 'Showing: All Nodes' }}
          </button>

          <!-- Expand / Collapse All -->
          <ng-container *ngIf="viewType === 'side-by-side-tree'">
            <button class="btn-sm btn-secondary" (click)="expandAll()">Expand All</button>
            <button class="btn-sm btn-secondary" (click)="collapseAll()">Collapse All</button>
          </ng-container>

          <!-- Presets Dropdown -->
          <select class="select-preset" (change)="loadPreset($event)">
            <option value="">-- Load Sample Pair --</option>
            <option value="v1v2">API V1 vs API V2</option>
            <option value="config">Config Dev vs Prod</option>
            <option value="user">User Profile Update</option>
          </select>

          <!-- Swap & Clear -->
          <button class="btn-sm btn-cyan" (click)="swapJsons()" [attr.data-tooltip]="'Swap left and right documents'">
            <app-icon name="sort" [size]="14" color="#000"></app-icon>
            Swap Left & Right
          </button>
        </div>
      </div>

      <!-- Main Diff Workspace -->
      <div class="diff-workspace">

        <!-- MODE 1: SIDE-BY-SIDE INTERACTIVE TREE -->
        <div *ngIf="viewType === 'side-by-side-tree'" class="tree-diff-workspace">
          <!-- Side-by-Side Column Headers -->
          <div class="workspace-headers">
            <div class="col-header left-header">
              <div class="col-title">
                <app-icon name="file" [size]="15" color="#000"></app-icon>
                <span>Document A (Original)</span>
              </div>
              <div class="col-actions">
                <button class="btn-xs btn-secondary" (click)="formatLeft()">Prettify</button>
                <button class="btn-xs btn-secondary" (click)="clearLeft()">Clear</button>
              </div>
            </div>
            <div class="col-header right-header">
              <div class="col-title">
                <app-icon name="file" [size]="15" color="#000"></app-icon>
                <span>Document B (Modified)</span>
              </div>
              <div class="col-actions">
                <button class="btn-xs btn-secondary" (click)="formatRight()">Prettify</button>
                <button class="btn-xs btn-secondary" (click)="clearRight()">Clear</button>
              </div>
            </div>
          </div>

          <!-- Synchronized Aligned Tree Grid -->
          <div class="aligned-tree-scroll-container">
            <div *ngFor="let row of alignedRows; let idx = index" class="aligned-row-pair" [class.closing-pair]="row.isClosingRow">

              <!-- LEFT SIDE CELL -->
              <div
                class="row-cell left-cell"
                [class.added]="row.status === 'added'"
                [class.removed]="row.status === 'removed'"
                [class.modified]="row.status === 'modified'"
                [class.placeholder]="!row.leftExists"
              >
                <!-- Indentation & Guide Lines -->
                <div class="indent-wrap" [style.width.px]="row.depth * 20">
                  <span *ngFor="let i of getIndentArray(row.depth)" class="indent-guide"></span>
                </div>

                <!-- Content if Left Exists -->
                <ng-container *ngIf="row.leftExists">
                  <!-- Closing Bracket Row -->
                  <ng-container *ngIf="row.isClosingRow">
                    <span class="closing-char">{{ row.closingChar }}</span>
                  </ng-container>

                  <!-- Normal Node Row -->
                  <ng-container *ngIf="!row.isClosingRow">
                    <!-- Expander Arrow for Containers -->
                    <button
                      *ngIf="row.isContainer"
                      class="diff-chevron-btn"
                      [class.expanded]="row.expanded"
                      (click)="toggleNodeExpand(row.path)"
                    >
                      <app-icon [name]="row.expanded ? 'chevron-down' : 'chevron-right'" [size]="12"></app-icon>
                    </button>
                    <span *ngIf="!row.isContainer" class="diff-chevron-spacer"></span>

                    <!-- Key & Value -->
                    <span class="node-key" *ngIf="row.key !== 'root'">{{ row.key }}:</span>
                    <span class="node-key root-key" *ngIf="row.key === 'root'">root:</span>

                    <span class="node-val" [class]="getValCssClass(row.leftValue, row.leftType)">
                      {{ formatValSummary(row.leftValue, row.leftType, row.containerType, row.childCount) }}
                    </span>

                    <span class="diff-tag removed-tag" *ngIf="row.status === 'removed'">- Removed</span>
                    <span class="diff-tag modified-tag" *ngIf="row.status === 'modified'">~ Modified</span>
                  </ng-container>
                </ng-container>

                <!-- Left Placeholder if missing in Document A -->
                <ng-container *ngIf="!row.leftExists">
                  <span class="placeholder-label">+ Added in Document B</span>
                </ng-container>
              </div>

              <!-- RIGHT SIDE CELL -->
              <div
                class="row-cell right-cell"
                [class.added]="row.status === 'added'"
                [class.removed]="row.status === 'removed'"
                [class.modified]="row.status === 'modified'"
                [class.placeholder]="!row.rightExists"
              >
                <!-- Indentation & Guide Lines -->
                <div class="indent-wrap" [style.width.px]="row.depth * 20">
                  <span *ngFor="let i of getIndentArray(row.depth)" class="indent-guide"></span>
                </div>

                <!-- Content if Right Exists -->
                <ng-container *ngIf="row.rightExists">
                  <!-- Closing Bracket Row -->
                  <ng-container *ngIf="row.isClosingRow">
                    <span class="closing-char">{{ row.closingChar }}</span>
                  </ng-container>

                  <!-- Normal Node Row -->
                  <ng-container *ngIf="!row.isClosingRow">
                    <!-- Expander Arrow for Containers -->
                    <button
                      *ngIf="row.isContainer"
                      class="diff-chevron-btn"
                      [class.expanded]="row.expanded"
                      (click)="toggleNodeExpand(row.path)"
                    >
                      <app-icon [name]="row.expanded ? 'chevron-down' : 'chevron-right'" [size]="12"></app-icon>
                    </button>
                    <span *ngIf="!row.isContainer" class="diff-chevron-spacer"></span>

                    <!-- Key & Value -->
                    <span class="node-key" *ngIf="row.key !== 'root'">{{ row.key }}:</span>
                    <span class="node-key root-key" *ngIf="row.key === 'root'">root:</span>

                    <span class="node-val" [class]="getValCssClass(row.rightValue, row.rightType)">
                      {{ formatValSummary(row.rightValue, row.rightType, row.containerType, row.childCount) }}
                    </span>

                    <span class="diff-tag added-tag" *ngIf="row.status === 'added'">+ Added</span>
                    <span class="diff-tag modified-tag" *ngIf="row.status === 'modified'">~ Modified</span>
                  </ng-container>
                </ng-container>

                <!-- Right Placeholder if missing in Document B -->
                <ng-container *ngIf="!row.rightExists">
                  <span class="placeholder-label">- Removed in Document B</span>
                </ng-container>
              </div>

            </div>

            <div *ngIf="alignedRows.length === 0" class="empty-diff-state">
              <app-icon name="check" [size]="28" color="var(--neo-green)"></app-icon>
              <h3>No Differences Found</h3>
              <p>Document A and Document B are completely identical.</p>
            </div>
          </div>
        </div>

        <!-- MODE 2: SIDE-BY-SIDE CODE EDITORS -->
        <div *ngIf="viewType === 'side-by-side-code'" class="code-diff-workspace">
          <div class="code-column">
            <div class="col-header left-header">
              <div class="col-title">
                <app-icon name="file" [size]="15" color="#000"></app-icon>
                <span>Document A (Original JSON Code)</span>
              </div>
              <button class="btn-xs btn-secondary" (click)="formatLeft()">Prettify</button>
            </div>
            <textarea
              class="code-textarea"
              [(ngModel)]="leftJson"
              (ngModelChange)="onJsonContentChange()"
              placeholder="Paste original JSON text here..."
              spellcheck="false"
            ></textarea>
          </div>

          <div class="code-column">
            <div class="col-header right-header">
              <div class="col-title">
                <app-icon name="file" [size]="15" color="#000"></app-icon>
                <span>Document B (Modified JSON Code)</span>
              </div>
              <button class="btn-xs btn-secondary" (click)="formatRight()">Prettify</button>
            </div>
            <textarea
              class="code-textarea"
              [(ngModel)]="rightJson"
              (ngModelChange)="onJsonContentChange()"
              placeholder="Paste modified JSON text here..."
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- MODE 3: UNIFIED DIFFERENCES LIST -->
        <div *ngIf="viewType === 'unified'" class="unified-workspace">
          <div class="unified-list" *ngIf="diffResult">
            <div
              *ngFor="let item of diffResult.diffs"
              class="unified-row"
              [class]="item.status"
              [style.paddingLeft.px]="item.depth * 20 + 12"
            >
              <span class="unified-badge" [class]="item.status">
                {{ item.status === 'added' ? '+' : item.status === 'removed' ? '-' : item.status === 'modified' ? '~' : '=' }}
              </span>

              <span class="diff-path">{{ item.path }}</span>

              <ng-container *ngIf="item.status === 'added'">
                <span class="val-added">{{ formatVal(item.newValue) }}</span>
              </ng-container>

              <ng-container *ngIf="item.status === 'removed'">
                <span class="val-removed">{{ formatVal(item.oldValue) }}</span>
              </ng-container>

              <ng-container *ngIf="item.status === 'modified'">
                <span class="val-removed">{{ formatVal(item.oldValue) }}</span>
                <span class="diff-arrow">→</span>
                <span class="val-added">{{ formatVal(item.newValue) }}</span>
              </ng-container>

              <ng-container *ngIf="item.status === 'unchanged'">
                <span class="val-unchanged">{{ formatVal(item.newValue) }}</span>
              </ng-container>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .diff-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background-color: var(--bg-app);
      overflow: hidden;
    }
    .diff-bar {
      height: var(--toolbar-height);
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      gap: 12px;
      box-shadow: 0 2px 0px rgba(0,0,0,0.05);
      flex-wrap: wrap;
    }
    .diff-summary {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.775rem;
      font-weight: 800;
      font-family: var(--font-mono);
      border: 2px solid var(--border-color);
      box-shadow: 2px 2px 0px var(--shadow-color);
    }
    .badge.added { background-color: var(--neo-green); color: #000000; }
    .badge.removed { background-color: var(--neo-pink); color: #ffffff; }
    .badge.modified { background-color: var(--neo-yellow); color: #000000; }
    .badge.unchanged { background-color: var(--bg-surface-hover); color: var(--text-dim); }

    .diff-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .view-type-switch {
      display: flex;
      background-color: var(--bg-editor);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 2px;
      box-shadow: var(--shadow-xs);
    }
    .switch-btn {
      height: 28px;
      padding: 0 10px;
      border: none;
      box-shadow: none;
      font-size: 0.775rem;
      font-weight: 800;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .switch-btn.active {
      background-color: var(--neo-yellow);
      color: #000000;
      box-shadow: 1px 1px 0px #000000;
      border: 1.5px solid #000000;
    }

    .btn-filter {
      background-color: var(--bg-surface);
      border: 2px solid var(--border-color);
      color: var(--text-main);
      font-weight: 800;
      font-size: 0.775rem;
      height: 28px;
      padding: 0 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-filter.active {
      background-color: var(--neo-pink);
      color: #ffffff;
      box-shadow: 2px 2px 0px #000000;
    }

    .select-preset {
      height: 28px;
      padding: 0 8px;
      font-size: 0.775rem;
      font-weight: 800;
      font-family: var(--font-main);
      background-color: var(--bg-surface);
      color: var(--text-main);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-xs);
      cursor: pointer;
    }

    .diff-workspace {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* SIDE-BY-SIDE TREE WORKSPACE */
    .tree-diff-workspace {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .workspace-headers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: 38px;
      border-bottom: 2px solid var(--border-color);
    }
    .col-header {
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 800;
    }
    .col-header.left-header {
      background-color: var(--neo-yellow);
      color: #000000;
      border-right: 2px solid var(--border-color);
    }
    .col-header.right-header {
      background-color: var(--neo-cyan);
      color: #000000;
    }
    .col-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .col-actions {
      display: flex;
      gap: 6px;
    }

    /* ALIGNED TREE SCROLL CONTAINER */
    .aligned-tree-scroll-container {
      flex: 1;
      overflow-y: auto;
      background-color: var(--bg-editor);
      padding: 4px 0;
    }
    .aligned-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 28px;
      border-bottom: 1px solid rgba(0,0,0,0.04);
    }
    .aligned-row-pair:hover {
      background-color: rgba(255,255,255,0.03);
    }

    .row-cell {
      display: flex;
      align-items: center;
      padding: 2px 10px;
      font-family: var(--font-mono);
      font-size: 0.825rem;
      font-weight: 600;
      min-height: 28px;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    }
    .left-cell {
      border-right: 2px solid var(--border-color);
    }

    /* Diff Row Colors */
    .row-cell.added {
      background-color: var(--diff-added-bg);
      color: var(--text-main);
    }
    .row-cell.removed {
      background-color: var(--diff-removed-bg);
      color: var(--text-main);
    }
    .row-cell.modified {
      background-color: var(--diff-changed-bg);
      color: var(--text-main);
    }
    .row-cell.placeholder {
      background: repeating-linear-gradient(
        45deg,
        rgba(0,0,0,0.03),
        rgba(0,0,0,0.03) 10px,
        rgba(0,0,0,0.06) 10px,
        rgba(0,0,0,0.06) 20px
      );
      color: var(--text-dim);
    }
    .placeholder-label {
      font-size: 0.725rem;
      font-weight: 800;
      font-style: italic;
      color: var(--text-dim);
      opacity: 0.7;
    }

    /* Indent guides */
    .indent-wrap {
      display: flex;
      height: 100%;
      flex-shrink: 0;
    }
    .indent-guide {
      width: 20px;
      height: 100%;
      border-left: 1px dashed var(--border-color);
      opacity: 0.35;
    }

    .diff-chevron-btn {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-main);
      margin-right: 4px;
      flex-shrink: 0;
    }
    .diff-chevron-spacer {
      width: 18px;
      margin-right: 4px;
      flex-shrink: 0;
    }

    .node-key {
      color: var(--syntax-key);
      font-weight: 800;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .node-key.root-key {
      color: var(--neo-purple);
    }
    .node-val {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }

    /* Syntax type classes */
    .node-val.val-string { color: var(--syntax-string); }
    .node-val.val-number { color: var(--syntax-number); }
    .node-val.val-boolean { color: var(--syntax-boolean); font-weight: 800; }
    .node-val.val-null { color: var(--syntax-null); font-style: italic; }
    .node-val.val-container { color: var(--text-muted); font-weight: 800; }

    .closing-char {
      font-weight: 800;
      color: var(--text-muted);
    }

    .diff-tag {
      font-size: 0.675rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid #000;
      margin-left: auto;
      flex-shrink: 0;
      box-shadow: 1px 1px 0px #000;
    }
    .added-tag { background-color: var(--neo-green); color: #000; }
    .removed-tag { background-color: var(--neo-pink); color: #fff; }
    .modified-tag { background-color: var(--neo-yellow); color: #000; }

    /* SIDE-BY-SIDE CODE WORKSPACE */
    .code-diff-workspace {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: 100%;
      overflow: hidden;
    }
    .code-column {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .code-column:first-child {
      border-right: 2px solid var(--border-color);
    }
    .code-textarea {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      resize: none;
      background-color: var(--bg-editor);
      color: var(--text-main);
      font-family: var(--font-mono);
      font-size: 0.825rem;
      font-weight: 600;
      padding: 14px;
      outline: none;
      line-height: 1.5;
    }

    /* UNIFIED LIST WORKSPACE */
    .unified-workspace {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background-color: var(--bg-editor);
    }
    .unified-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 2px solid var(--border-color);
      box-shadow: 2px 2px 0px var(--shadow-color);
      font-family: var(--font-mono);
      font-size: 0.825rem;
      font-weight: 700;
      margin-bottom: 6px;
      background-color: var(--bg-surface);
    }
    .unified-row.added { background-color: var(--diff-added-bg); }
    .unified-row.removed { background-color: var(--diff-removed-bg); }
    .unified-row.modified { background-color: var(--diff-changed-bg); }

    .unified-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1.5px solid #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .unified-badge.added { background: var(--neo-green); color: #000; }
    .unified-badge.removed { background: var(--neo-pink); color: #fff; }
    .unified-badge.modified { background: var(--neo-yellow); color: #000; }

    .diff-path {
      color: var(--syntax-key);
      font-weight: 800;
    }
    .diff-arrow {
      color: var(--text-dim);
      font-weight: 900;
    }

    .empty-diff-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 12px;
      color: var(--text-muted);
    }
    .empty-diff-state h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .btn-xs {
      height: 24px;
      padding: 0 8px;
      font-size: 0.725rem;
      font-weight: 800;
    }

    @media (max-width: 768px) {
      .workspace-headers,
      .code-diff-workspace {
        grid-template-columns: 1fr;
      }
      .aligned-row-pair {
        grid-template-columns: 1fr;
      }
      .left-cell {
        border-right: none;
        border-bottom: 1px dashed var(--border-color);
      }
    }
  `]
})
export class JsonDiffComponent implements OnInit {
  diffService = inject(JsonDiffService);
  parserService = inject(JsonParserService);
  formatterService = inject(JsonFormatterService);
  fileService = inject(FileService);

  leftJson: string = '';
  rightJson: string = '';
  viewType: 'side-by-side-tree' | 'side-by-side-code' | 'unified' = 'side-by-side-tree';
  onlyChanges: boolean = false;

  expandedStateMap: Map<string, boolean> = new Map();
  alignedRows: AlignedDiffRow[] = [];
  diffResult: ReturnType<typeof this.diffService.compareJsons> | null = null;
  stats: { added: number; removed: number; modified: number; unchanged: number } = {
    added: 0, removed: 0, modified: 0, unchanged: 0
  };

  ngOnInit() {
    this.leftJson = this.parserService.rawJson();
    if (!this.leftJson) {
      this.leftJson = JSON.stringify({
        status: 200,
        success: true,
        message: "Data retrieved successfully",
        meta: { page: 1, pageSize: 20, totalRecords: 95, executionTimeMs: 14.2 },
        data: [
          { id: "alpha-1", name: "Alpha Service", endpoint: "/v1/alpha", health: "HEALTHY", latencyMs: 45 },
          { id: "beta-1", name: "Beta Pipeline", endpoint: "/v1/beta", health: "HEALTHY", latencyMs: 22 }
        ],
        warnings: null
      }, null, 2);
    }

    this.rightJson = JSON.stringify({
      status: 200,
      success: true,
      message: "Data retrieved successfully",
      meta: { page: 1, pageSize: 50, totalPages: 5, totalRecords: 90, executionTimeMs: 14.25 },
      data: [
        { id: "alpha-1", name: "Alpha Service Pro", endpoint: "/v1/alpha", health: "HEALTHY", latencyMs: 40 },
        { id: "beta-1", name: "Beta Pipeline", endpoint: "/v1/beta", health: "HEALTHY", latencyMs: 23 },
        { id: "gamma-1", name: "Gamma Queue", endpoint: "/v1/gamma", health: "DEGRADED", latencyMs: 240 }
      ],
      user: { name: "John Doe", role: "Lead Staff Architect", active: true, skills: ["TypeScript", "Angular 21", "RxJS", "Signals", "Rust"] }
    }, null, 2);

    this.runDiff();
  }

  runDiff() {
    this.diffResult = this.diffService.compareJsons(this.leftJson, this.rightJson);
    const result = this.diffService.getAlignedDiffRows(
      this.leftJson,
      this.rightJson,
      this.expandedStateMap,
      this.onlyChanges
    );
    this.alignedRows = result.rows;
    this.stats = result.stats;
  }

  onJsonContentChange() {
    this.runDiff();
  }

  setViewType(type: 'side-by-side-tree' | 'side-by-side-code' | 'unified') {
    this.viewType = type;
    this.runDiff();
  }

  toggleOnlyChanges() {
    this.onlyChanges = !this.onlyChanges;
    this.runDiff();
  }

  toggleNodeExpand(path: string) {
    const isCurrentlyExpanded = this.expandedStateMap.has(path)
      ? this.expandedStateMap.get(path)!
      : true; // Default depth < 2 is expanded

    this.expandedStateMap.set(path, !isCurrentlyExpanded);
    this.runDiff();
  }

  expandAll() {
    for (const r of this.alignedRows) {
      if (r.isContainer && r.path) {
        this.expandedStateMap.set(r.path, true);
      }
    }
    this.runDiff();
  }

  collapseAll() {
    for (const r of this.alignedRows) {
      if (r.isContainer && r.path) {
        this.expandedStateMap.set(r.path, false);
      }
    }
    this.runDiff();
  }

  swapJsons() {
    const temp = this.leftJson;
    this.leftJson = this.rightJson;
    this.rightJson = temp;
    this.runDiff();
  }

  formatLeft() {
    if (this.leftJson) {
      this.leftJson = this.formatterService.formatJson(this.leftJson, '2');
      this.runDiff();
    }
  }

  formatRight() {
    if (this.rightJson) {
      this.rightJson = this.formatterService.formatJson(this.rightJson, '2');
      this.runDiff();
    }
  }

  clearLeft() {
    this.leftJson = '';
    this.runDiff();
  }

  clearRight() {
    this.rightJson = '';
    this.runDiff();
  }

  loadPreset(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;

    if (val === 'v1v2') {
      this.leftJson = JSON.stringify({
        apiVersion: "v1.0",
        endpoint: "https://api.service.io/v1/users",
        rateLimit: 100,
        deprecated: false,
        features: ["auth", "logs"]
      }, null, 2);

      this.rightJson = JSON.stringify({
        apiVersion: "v2.0",
        endpoint: "https://api.service.io/v2/users",
        rateLimit: 500,
        deprecated: false,
        features: ["auth", "logs", "webhooks", "analytics"],
        cors: { enabled: true, origins: ["*"] }
      }, null, 2);
    } else if (val === 'config') {
      this.leftJson = JSON.stringify({
        env: "development",
        debug: true,
        port: 3000,
        database: { host: "localhost", name: "dev_db" }
      }, null, 2);

      this.rightJson = JSON.stringify({
        env: "production",
        debug: false,
        port: 8080,
        database: { host: "db.internal.net", name: "prod_db", poolSize: 20 }
      }, null, 2);
    } else if (val === 'user') {
      this.leftJson = JSON.stringify({
        id: 42,
        name: "Jane Doe",
        email: "jane@company.org",
        role: "developer"
      }, null, 2);

      this.rightJson = JSON.stringify({
        id: 42,
        name: "Jane Doe",
        email: "jane.doe@company.org",
        role: "admin",
        lastLogin: "2026-10-02T16:00:00Z"
      }, null, 2);
    }

    this.runDiff();
  }

  getIndentArray(depth: number): number[] {
    return Array.from({ length: depth }, (_, i) => i);
  }

  formatValSummary(val: any, type?: string, containerType?: 'object' | 'array', childCount?: number): string {
    if (containerType === 'object') return `{ ${childCount ?? 0} keys }`;
    if (containerType === 'array') return `[ ${childCount ?? 0} items ]`;

    if (type === 'string') return `"${val}"`;
    if (type === 'null' || val === null) return 'null';
    return String(val);
  }

  formatVal(val: any): string {
    if (typeof val === 'object' && val !== null) {
      return Array.isArray(val) ? `[ ${val.length} items ]` : `{ ${Object.keys(val).length} keys }`;
    }
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  }

  getValCssClass(val: any, type?: string): string {
    if (type === 'string') return 'val-string';
    if (type === 'number') return 'val-number';
    if (type === 'boolean') return 'val-boolean';
    if (type === 'null' || val === null) return 'val-null';
    return 'val-container';
  }
}
