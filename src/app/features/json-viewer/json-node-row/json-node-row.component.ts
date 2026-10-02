import { Component, Input, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode } from '../../../core/models/json-node.model';
import { JsonParserService } from '../../../core/services/json-parser.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-json-node-row',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <!-- Regular Node Row -->
    <div
      *ngIf="!node.isClosing"
      class="node-row"
      [class.selected]="isSelected"
      [class.matched]="node.matched"
      [style.paddingLeft.px]="node.depth * 22 + 10"
      (click)="selectNode($event)"
    >
      <!-- Vertical Indent Guide Lines for depth -->
      <div class="indent-guides" *ngIf="node.depth > 0">
        <span
          *ngFor="let idx of indentArray"
          class="guide-line"
          [style.left.px]="idx * 22 + 18"
        ></span>
      </div>

      <!-- Expand / Collapse Toggle Icon -->
      <span
        *ngIf="isExpandable"
        class="toggle-icon-wrap"
        (click)="toggleExpand($event)"
      >
        <app-icon
          [name]="node.expanded ? 'chevron-down' : 'chevron-right'"
          [size]="15"
          class="toggle-icon"
        ></app-icon>
      </span>

      <!-- Spacer for non-expandable leaf nodes -->
      <span *ngIf="!isExpandable" class="toggle-spacer"></span>

      <!-- Node Key Name / Array Index -->
      <div class="key-container" *ngIf="node.key !== 'root'">
        <span
          *ngIf="!isEditingKey"
          class="node-key"
          [class.array-index]="isArrayIndex"
          (dblclick)="startEditKey($event)"
        >
          {{ node.key }}
        </span>
        <input
          #keyInput
          *ngIf="isEditingKey"
          type="text"
          class="inline-edit-input key-edit"
          [(ngModel)]="editingKeyText"
          (keydown.enter)="saveKeyEdit()"
          (keydown.escape)="cancelKeyEdit()"
          (blur)="saveKeyEdit()"
          (click)="$event.stopPropagation()"
        />
        <span class="colon">:</span>
      </div>

      <!-- Node Value / Container Summary -->
      <div class="value-container">
        <!-- Object / Array Open Bracket & Child Count badge -->
        <ng-container *ngIf="node.type === 'object'">
          <span class="bracket">&#123;</span>
          <span class="count-badge" *ngIf="!node.expanded || node.childrenCount === 0">
            {{ node.childrenCount }} {{ node.childrenCount === 1 ? 'key' : 'keys' }}
          </span>
          <span class="bracket" *ngIf="!node.expanded">&#125;</span>
        </ng-container>

        <ng-container *ngIf="node.type === 'array'">
          <span class="bracket">&#91;</span>
          <span class="count-badge" *ngIf="!node.expanded || node.childrenCount === 0">
            {{ node.childrenCount }} {{ node.childrenCount === 1 ? 'item' : 'items' }}
          </span>
          <span class="bracket" *ngIf="!node.expanded">&#93;</span>
        </ng-container>

        <!-- Leaf Values -->
        <ng-container *ngIf="node.type !== 'object' && node.type !== 'array'">
          <span
            *ngIf="!isEditingValue"
            class="node-value"
            [class]="'type-' + node.type"
            (dblclick)="startEditValue($event)"
          >
            {{ formatValue(node.value) }}
          </span>

          <!-- Inline Edit Input -->
          <input
            #valueInput
            *ngIf="isEditingValue"
            type="text"
            class="inline-edit-input value-edit"
            [(ngModel)]="editingValueText"
            (keydown.enter)="saveValueEdit()"
            (keydown.escape)="cancelValueEdit()"
            (blur)="saveValueEdit()"
            (click)="$event.stopPropagation()"
          />
        </ng-container>
      </div>

      <!-- Action Buttons -->
      <div class="row-actions" (click)="$event.stopPropagation()">
        <button class="action-btn" (click)="copyValue()" [attr.data-tooltip]="'Copy Value'">
          <app-icon name="copy" [size]="13"></app-icon>
        </button>

        <button class="action-btn" (click)="copyPath()" [attr.data-tooltip]="'Copy Path'">
          <app-icon name="code" [size]="13"></app-icon>
        </button>

        <button
          *ngIf="isExpandable"
          class="action-btn btn-green"
          (click)="onAddChild()"
          [attr.data-tooltip]="'Add Property / Item'"
        >
          <app-icon name="plus" [size]="13" color="#000"></app-icon>
        </button>

        <button
          *ngIf="!node.isRoot"
          class="action-btn btn-cyan"
          (click)="duplicateNode()"
          [attr.data-tooltip]="'Duplicate Node'"
        >
          <app-icon name="duplicate" [size]="13" color="#000"></app-icon>
        </button>

        <button
          *ngIf="!node.isRoot"
          class="action-btn btn-pink"
          (click)="deleteNode()"
          [attr.data-tooltip]="'Delete Node'"
        >
          <app-icon name="trash" [size]="13" color="#fff"></app-icon>
        </button>
      </div>
    </div>

    <!-- Closing Bracket Row for Expanded Objects/Arrays -->
    <div
      *ngIf="node.isClosing"
      class="node-row closing-row"
      [style.paddingLeft.px]="node.depth * 22 + 10"
    >
      <span class="toggle-spacer"></span>
      <span class="bracket closing-bracket">{{ node.closingChar }}</span>
    </div>
  `,
  styles: [`
    .node-row {
      display: flex;
      align-items: center;
      height: 32px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      position: relative;
      user-select: none;
      border-radius: var(--radius-sm);
      transition: background-color 0.1s ease;
      margin: 1px 0;
    }
    .node-row:hover {
      background-color: var(--bg-surface-hover);
    }
    .node-row:hover .row-actions {
      display: flex;
    }
    
    .node-row.closing-row {
      cursor: default;
      height: 26px;
      opacity: 0.9;
    }
    .closing-bracket {
      font-size: 1rem;
      font-weight: 800;
      color: var(--syntax-bracket);
    }

    /* Vertical Indent Guides */
    .indent-guides {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
    }
    .guide-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: var(--text-dim);
      opacity: 0.25;
    }

    /* Selected Node Highlight */
    .node-row.selected {
      background-color: var(--neo-yellow) !important;
      color: #000000 !important;
      border: 2px solid #000000 !important;
      box-shadow: 2px 2px 0px #000000 !important;
    }
    .node-row.selected .toggle-icon-wrap,
    .node-row.selected .toggle-icon,
    .node-row.selected .node-key,
    .node-row.selected .node-value,
    .node-row.selected .colon,
    .node-row.selected .bracket {
      color: #000000 !important;
    }

    /* Ensure array index badge is high-contrast and readable when selected! */
    .node-row.selected .node-key.array-index {
      background-color: rgba(0, 0, 0, 0.15) !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }

    .node-row.matched {
      background-color: var(--neo-cyan);
      color: #000000;
      border: 2px solid #000000;
    }

    .toggle-icon-wrap {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      cursor: pointer;
      color: var(--text-main);
      border-radius: 4px;
      transition: transform 0.15s ease, color 0.15s ease;
    }
    .toggle-icon-wrap:hover {
      color: var(--neo-yellow);
      transform: scale(1.2);
    }
    .toggle-spacer {
      width: 22px;
      margin-right: 8px;
      display: inline-block;
    }

    .key-container {
      display: inline-flex;
      align-items: center;
      margin-right: 8px;
      gap: 2px;
    }
    .node-key {
      color: var(--syntax-key);
      font-weight: 700;
    }
    .node-key.array-index {
      color: var(--syntax-index);
      background-color: rgba(165, 180, 252, 0.2);
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      font-weight: 800;
    }
    .colon {
      color: var(--syntax-colon);
      margin-left: 2px;
      font-weight: 800;
    }

    .value-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .bracket {
      color: var(--syntax-bracket);
      font-weight: 800;
    }
    .count-badge {
      font-size: 0.725rem;
      font-weight: 800;
      color: #000000;
      background-color: var(--neo-yellow);
      padding: 1px 7px;
      border: 1.5px solid #000000;
      border-radius: 4px;
      box-shadow: 1.5px 1.5px 0px #000000;
      margin: 0 4px;
    }

    .node-value.type-string {
      color: var(--syntax-string);
    }
    .node-value.type-number {
      color: var(--syntax-number);
    }
    .node-value.type-boolean {
      color: var(--syntax-boolean);
      font-weight: 800;
    }
    .node-value.type-null {
      color: var(--syntax-null);
      font-style: italic;
    }

    .inline-edit-input {
      height: 24px;
      padding: 0 4px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 700;
      background-color: var(--bg-surface);
      border: 2px solid #000000;
    }
    .key-edit {
      width: 120px;
      color: var(--syntax-key);
    }
    .value-edit {
      width: 150px;
      color: var(--text-main);
    }

    .row-actions {
      display: none;
      position: absolute;
      right: 12px;
      align-items: center;
      gap: 4px;
      background-color: var(--bg-surface);
      border: 2px solid #000000;
      border-radius: var(--radius-sm);
      padding: 3px 6px;
      box-shadow: 3px 3px 0px #000000;
      z-index: 100;
    }
    .action-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 3px;
      border: 1px solid #000000;
      box-shadow: 1px 1px 0px #000000;
    }
    .action-btn:hover {
      transform: scale(1.08);
    }
  `]
})
export class JsonNodeRowComponent {
  parserService = inject(JsonParserService);
  clipboardService = inject(ClipboardService);

  @Input() node!: TreeNode;
  @ViewChild('keyInput') keyInput?: ElementRef<HTMLInputElement>;
  @ViewChild('valueInput') valueInput?: ElementRef<HTMLInputElement>;

  isEditingKey: boolean = false;
  editingKeyText: string = '';

  isEditingValue: boolean = false;
  editingValueText: string = '';

  get indentArray(): number[] {
    const arr: number[] = [];
    for (let i = 0; i < this.node.depth; i++) {
      arr.push(i);
    }
    return arr;
  }

  get isExpandable(): boolean {
    return (this.node.type === 'object' || this.node.type === 'array') && !this.node.isClosing;
  }

  get isArrayIndex(): boolean {
    return typeof this.node.key === 'number';
  }

  get isSelected(): boolean {
    return this.parserService.selectedNodeId() === this.node.id;
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.parserService.toggleExpand(this.node.id);
  }

  selectNode(event: Event) {
    event.stopPropagation();
    this.parserService.selectNode(this.node.id);
  }

  formatValue(val: any): string {
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  }

  copyValue() {
    let strVal = '';
    if (this.node.type === 'object' || this.node.type === 'array') {
      strVal = JSON.stringify(this.node.value, null, 2);
    } else {
      strVal = String(this.node.value);
    }
    this.clipboardService.copyText(strVal, `Copied value for ${this.node.key}`);
  }

  copyPath() {
    this.clipboardService.copyText(this.node.path, `Copied path "${this.node.path}"`);
  }

  // Edit Key
  startEditKey(event: Event) {
    event.stopPropagation();
    if (this.node.isRoot || typeof this.node.key !== 'string') return;
    this.isEditingKey = true;
    this.editingKeyText = String(this.node.key);
    setTimeout(() => this.keyInput?.nativeElement.focus(), 50);
  }

  saveKeyEdit() {
    if (this.isEditingKey && this.editingKeyText.trim()) {
      this.parserService.renameProperty(this.node.id, this.editingKeyText.trim());
      this.isEditingKey = false;
    }
  }

  cancelKeyEdit() {
    this.isEditingKey = false;
  }

  // Edit Value
  startEditValue(event: Event) {
    event.stopPropagation();
    this.isEditingValue = true;
    this.editingValueText = String(this.node.value);
    setTimeout(() => this.valueInput?.nativeElement.focus(), 50);
  }

  saveValueEdit() {
    if (this.isEditingValue) {
      this.parserService.updateNodeValue(this.node.id, this.editingValueText);
      this.isEditingValue = false;
    }
  }

  cancelValueEdit() {
    this.isEditingValue = false;
  }

  // Node operations
  onAddChild() {
    const key = prompt('Enter property key name:', 'newKey');
    if (key) {
      this.parserService.addProperty(this.node.id, key, '', 'string');
    }
  }

  duplicateNode() {
    this.parserService.duplicateNode(this.node.id);
  }

  deleteNode() {
    if (confirm(`Delete property "${this.node.key}"?`)) {
      this.parserService.deleteNode(this.node.id);
    }
  }
}
