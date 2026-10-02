import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonParserService } from '../../core/services/json-parser.service';
import { JsonFormatterService, IndentType } from '../../core/services/json-formatter.service';
import { FileService } from '../../core/services/file.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { SAMPLE_DATASETS } from '../../core/constants/sample-data';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div
      class="editor-panel"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [class.drag-over]="isDragging"
    >
      <!-- Editor Header Toolbar -->
      <div class="editor-header">
        <div class="header-title">
          <app-icon name="file" [size]="16"></app-icon>
          <span>JSON Input</span>
        </div>

        <div class="header-actions">
          <!-- Indentation Selector -->
          <div class="indent-select-group">
            <span class="label">Indent:</span>
            <select [(ngModel)]="indentOption" class="indent-select" (change)="onIndentChange()">
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          <div class="divider"></div>

          <!-- Action Buttons -->
          <button class="btn-sm btn-primary" (click)="formatJson()" [attr.data-tooltip]="'Prettify JSON (Ctrl+Enter)'">
            <app-icon name="format" [size]="14"></app-icon>
            Format
          </button>
          <button class="btn-sm btn-cyan" (click)="minifyJson()" [attr.data-tooltip]="'Minify JSON'">
            <app-icon name="minify" [size]="14"></app-icon>
            Minify
          </button>
          <button
            class="btn-sm btn-pink"
            [class.active]="sortKeys"
            (click)="toggleSortKeys()"
            [attr.data-tooltip]="'Sort Keys Alphabetically'"
          >
            <app-icon name="sort" [size]="14"></app-icon>
            Sort
          </button>
          <button class="btn-sm btn-secondary" (click)="clearJson()" [attr.data-tooltip]="'Clear Input'">
            <app-icon name="trash" [size]="14"></app-icon>
            Clear
          </button>
        </div>
      </div>

      <!-- Main Textarea Area -->
      <div class="textarea-container">
        <textarea
          #editorTextarea
          class="json-textarea"
          [(ngModel)]="inputText"
          (ngModelChange)="onTextChange($event)"
          placeholder="Paste or type JSON data here, or drag & drop a .json file..."
          spellcheck="false"
        ></textarea>

        <!-- Drop Overlay -->
        <div class="drop-overlay" *ngIf="isDragging">
          <app-icon name="upload" [size]="54" color="#000000"></app-icon>
          <h3>Drop JSON File Here</h3>
          <p>The file will be parsed immediately</p>
        </div>
      </div>

      <!-- Validation Banner & Quick Actions -->
      <div class="editor-footer">
        <div class="validation-status">
          <!-- Valid -->
          <div *ngIf="parserService.validationResult().valid && inputText.trim()" class="status-badge valid">
            <app-icon name="check" [size]="14" color="#000"></app-icon>
            <span>✓ Valid JSON</span>
          </div>

          <!-- Invalid -->
          <div *ngIf="!parserService.validationResult().valid" class="status-badge invalid">
            <app-icon name="warning" [size]="14" color="#fff"></app-icon>
            <span>
              Invalid: {{ parserService.validationResult().error }}
              <ng-container *ngIf="parserService.validationResult().line">
                (L{{ parserService.validationResult().line }}, C{{ parserService.validationResult().column }})
              </ng-container>
            </span>
          </div>

          <!-- Empty -->
          <div *ngIf="!inputText.trim()" class="status-badge empty">
            <span>Empty Input</span>
          </div>
        </div>

        <!-- Utility Buttons: Paste, Open File, Sample Dropdown -->
        <div class="footer-actions">
          <!-- Sample JSON Dropdown -->
          <div class="samples-dropdown">
            <select (change)="loadSample($event)" class="sample-select">
              <option value="" disabled selected>Load Sample Data...</option>
              <option *ngFor="let sample of samples" [value]="sample.id">
                {{ sample.name }}
              </option>
            </select>
          </div>

          <!-- Open File -->
          <button class="btn-sm btn-green" (click)="fileInput.click()">
            <app-icon name="upload" [size]="14" color="#000"></app-icon>
            Open File
          </button>
          <input
            #fileInput
            type="file"
            accept=".json,application/json,text/plain"
            style="display: none;"
            (change)="onFileSelected($event)"
          />

          <!-- Paste Clipboard -->
          <button class="btn-sm btn-secondary" (click)="pasteFromClipboard()">
            <app-icon name="copy" [size]="14"></app-icon>
            Paste
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-panel);
      position: relative;
      overflow: hidden;
    }
    .editor-header {
      height: var(--toolbar-height);
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .indent-select-group {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .indent-select, .sample-select {
      height: 30px;
      font-size: 0.775rem;
      font-weight: 700;
      padding: 0 6px;
      border: 2px solid var(--border-color);
    }
    .divider {
      width: 2px;
      height: 18px;
      background-color: var(--border-color);
      margin: 0 2px;
    }

    .textarea-container {
      flex: 1;
      position: relative;
      display: flex;
      background-color: var(--bg-editor);
      padding: 8px;
    }
    .json-textarea {
      width: 100%;
      height: 100%;
      border: 2px solid var(--border-color);
      resize: none;
      background: var(--bg-editor);
      color: var(--text-main);
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.5;
      padding: 12px;
      white-space: pre;
      tab-size: 2;
      box-shadow: var(--shadow-xs);
    }

    .drop-overlay {
      position: absolute;
      inset: 12px;
      background: var(--neo-yellow);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 50;
      border: 3px solid #000000;
      box-shadow: 6px 6px 0px #000000;
      color: #000000;
    }
    .drop-overlay h3 {
      font-size: 1.3rem;
      font-weight: 800;
    }

    .editor-footer {
      height: var(--toolbar-height);
      background-color: var(--bg-surface);
      border-top: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
    }
    .validation-status {
      display: flex;
      align-items: center;
      overflow: hidden;
      margin-right: 12px;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.775rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 2px solid var(--border-color);
      box-shadow: 2px 2px 0px var(--shadow-color);
      white-space: nowrap;
    }
    .status-badge.valid {
      background-color: var(--neo-green);
      color: #000000;
    }
    .status-badge.invalid {
      background-color: var(--neo-pink);
      color: #ffffff;
    }
    .status-badge.empty {
      background-color: var(--bg-surface-hover);
      color: var(--text-dim);
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  `]
})
export class JsonEditorComponent {
  parserService = inject(JsonParserService);
  formatterService = inject(JsonFormatterService);
  fileService = inject(FileService);
  toastService = inject(ToastService);

  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;

  inputText: string = '';
  indentOption: IndentType = '2';
  sortKeys: boolean = false;
  isDragging: boolean = false;
  samples = SAMPLE_DATASETS;

  ngOnInit() {
    this.inputText = this.parserService.rawJson();
    if (!this.inputText) {
      this.loadSampleById('user-profile');
    }
  }

  onTextChange(text: string) {
    this.parserService.setRawJson(text);
  }

  formatJson() {
    try {
      if (!this.inputText.trim()) return;
      const formatted = this.formatterService.formatJson(this.inputText, this.indentOption, this.sortKeys);
      this.inputText = formatted;
      this.parserService.setRawJson(formatted);
      this.toastService.success('Formatted JSON');
    } catch (e: any) {
      this.toastService.error('Cannot format invalid JSON');
    }
  }

  minifyJson() {
    try {
      if (!this.inputText.trim()) return;
      const minified = this.formatterService.minifyJson(this.inputText);
      this.inputText = minified;
      this.parserService.setRawJson(minified);
      this.toastService.success('Minified JSON');
    } catch (e: any) {
      this.toastService.error('Cannot minify invalid JSON');
    }
  }

  toggleSortKeys() {
    this.sortKeys = !this.sortKeys;
    if (this.sortKeys && this.inputText.trim()) {
      this.formatJson();
    }
  }

  onIndentChange() {
    if (this.inputText.trim()) {
      this.formatJson();
    }
  }

  clearJson() {
    this.inputText = '';
    this.parserService.setRawJson('');
    this.toastService.info('Input cleared');
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.inputText = text;
        this.parserService.setRawJson(text);
        this.toastService.success('Pasted from clipboard');
      }
    } catch (e) {
      this.toastService.error('Failed to access clipboard');
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const result = await this.fileService.readFile(input.files[0]);
      this.inputText = result.content;
      this.parserService.setRawJson(result.content);
      this.toastService.success(`Loaded ${result.filename}`);
      input.value = '';
    }
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const result = await this.fileService.readFile(file);
      this.inputText = result.content;
      this.parserService.setRawJson(result.content);
      this.toastService.success(`Loaded ${result.filename}`);
    }
  }

  loadSample(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.loadSampleById(select.value);
    }
  }

  loadSampleById(id: string) {
    const sample = SAMPLE_DATASETS.find(s => s.id === id);
    if (sample) {
      const jsonStr = JSON.stringify(sample.data, null, 2);
      this.inputText = jsonStr;
      this.parserService.setRawJson(jsonStr);
    }
  }
}
