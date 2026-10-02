import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonParserService } from '../../core/services/json-parser.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="search-bar">
      <div class="input-wrapper">
        <app-icon name="search" [size]="16" class="search-icon"></app-icon>
        <input
          type="text"
          class="search-input"
          placeholder="Search keys, values, or paths... (Ctrl+F)"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onQueryChange($event)"
          (keydown.enter)="nextMatch()"
          (keydown.escape)="clearSearch()"
        />

        <div class="match-indicator" *ngIf="matchCount > 0">
          <span>{{ currentIndex + 1 }} of {{ matchCount }}</span>
        </div>
        <div class="match-indicator no-matches" *ngIf="searchQuery && matchCount === 0">
          <span>No matches</span>
        </div>

        <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">
          <app-icon name="x" [size]="12"></app-icon>
        </button>
      </div>

      <!-- Nav buttons -->
      <div class="nav-buttons" *ngIf="matchCount > 0">
        <button class="btn-icon btn-xs" (click)="previousMatch()" [attr.data-tooltip]="'Previous match (Shift+Enter)'">
          <app-icon name="arrow-up" [size]="14"></app-icon>
        </button>
        <button class="btn-icon btn-xs" (click)="nextMatch()" [attr.data-tooltip]="'Next match (Enter)'">
          <app-icon name="arrow-down" [size]="14"></app-icon>
        </button>
      </div>

      <div class="divider"></div>

      <!-- Toggles -->
      <div class="toggles-group">
        <button
          class="toggle-btn"
          [class.active]="searchOptions.caseSensitive"
          (click)="toggleOption('caseSensitive')"
          [attr.data-tooltip]="'Match Case (Aa)'"
        >
          Aa
        </button>
        <button
          class="toggle-btn"
          [class.active]="searchOptions.wholeWord"
          (click)="toggleOption('wholeWord')"
          [attr.data-tooltip]="'Match Whole Word'"
        >
          \\b
        </button>
        <button
          class="toggle-btn"
          [class.active]="searchOptions.searchKeys"
          (click)="toggleOption('searchKeys')"
          [attr.data-tooltip]="'Search Keys'"
        >
          Keys
        </button>
        <button
          class="toggle-btn"
          [class.active]="searchOptions.searchValues"
          (click)="toggleOption('searchValues')"
          [attr.data-tooltip]="'Search Values'"
        >
          Vals
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-bar {
      height: 42px;
      background-color: var(--bg-surface);
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 8px;
    }
    .input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      color: var(--text-main);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: 32px;
      padding-left: 32px;
      padding-right: 90px;
      font-size: 0.825rem;
      font-weight: 700;
      border: 2px solid var(--border-color);
    }
    .match-indicator {
      position: absolute;
      right: 28px;
      font-size: 0.725rem;
      font-weight: 800;
      color: #000000;
      background-color: var(--neo-yellow);
      padding: 2px 6px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      user-select: none;
    }
    .match-indicator.no-matches {
      background-color: var(--neo-pink);
      color: #ffffff;
    }
    .clear-btn {
      position: absolute;
      right: 6px;
      padding: 2px;
      border: none;
      box-shadow: none;
    }
    .nav-buttons {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .divider {
      width: 2px;
      height: 20px;
      background-color: var(--border-color);
    }
    .toggles-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .toggle-btn {
      height: 28px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--text-main);
      background-color: var(--bg-surface);
      border: 2px solid var(--border-color);
      box-shadow: 1px 1px 0px var(--shadow-color);
    }
    .toggle-btn.active {
      background-color: var(--neo-cyan);
      color: #000000;
      box-shadow: 2px 2px 0px #000000;
    }
    .btn-xs {
      width: 28px;
      height: 28px;
      padding: 0;
    }
  `]
})
export class SearchBarComponent {
  parserService = inject(JsonParserService);

  searchQuery: string = '';

  get searchOptions() {
    return this.parserService.searchOptions();
  }

  get matchCount(): number {
    return this.parserService.searchResults().length;
  }

  get currentIndex(): number {
    return this.parserService.currentSearchIndex();
  }

  onQueryChange(query: string) {
    this.parserService.setSearchOptions({ query });
  }

  toggleOption(key: keyof ReturnType<typeof this.parserService.searchOptions>) {
    const currentVal = this.searchOptions[key];
    this.parserService.setSearchOptions({ [key]: !currentVal });
  }

  nextMatch() {
    this.parserService.nextMatch();
  }

  previousMatch() {
    this.parserService.previousMatch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.parserService.setSearchOptions({ query: '' });
  }
}
