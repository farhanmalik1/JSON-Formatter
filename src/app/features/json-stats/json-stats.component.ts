import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonParserService } from '../../core/services/json-parser.service';
import { JsonStatisticsService } from '../../core/services/json-statistics.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-json-stats',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="statusbar">
      <!-- Left: Privacy & Size -->
      <div class="status-left">
        <span class="privacy-badge" [attr.data-tooltip]="'100% Local Browser Processing. Zero server telemetry.'">
          <app-icon name="check" [size]="14" color="#000"></app-icon>
          Client-Side Only
        </span>

        <span class="divider"></span>

        <span class="stat-item size-badge" *ngIf="stats().size > 0">
          <span class="label">Size:</span>
          <span class="val">{{ formattedSize }}</span>
        </span>
      </div>

      <!-- Right: Detailed Counts -->
      <div class="status-right" *ngIf="stats().size > 0">
        <span class="stat-badge">
          <span class="label">Objects:</span>
          <span class="val">{{ stats().objects }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Arrays:</span>
          <span class="val">{{ stats().arrays }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Keys:</span>
          <span class="val">{{ stats().keys }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Strings:</span>
          <span class="val">{{ stats().strings }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Numbers:</span>
          <span class="val">{{ stats().numbers }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Booleans:</span>
          <span class="val">{{ stats().booleans }}</span>
        </span>
        <span class="stat-badge" *ngIf="stats().nulls > 0">
          <span class="label">Nulls:</span>
          <span class="val">{{ stats().nulls }}</span>
        </span>
        <span class="stat-badge">
          <span class="label">Depth:</span>
          <span class="val">{{ stats().depth }}</span>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .statusbar {
      height: var(--statusbar-height);
      background-color: var(--bg-surface);
      border-top: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--text-main);
      user-select: none;
    }
    .status-left, .status-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .privacy-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 800;
      color: #000000;
      background-color: var(--neo-green);
      padding: 2px 8px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      box-shadow: 1px 1px 0px var(--shadow-color);
    }
    .divider {
      width: 2px;
      height: 16px;
      background-color: var(--border-color);
    }
    .stat-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      background-color: var(--bg-surface-hover);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }
    .stat-badge .label {
      color: var(--text-dim);
    }
    .stat-badge .val {
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--text-main);
    }

    @media (max-width: 800px) {
      .status-right {
        display: none;
      }
    }
  `]
})
export class JsonStatsComponent {
  parserService = inject(JsonParserService);
  statsService = inject(JsonStatisticsService);

  stats = computed(() => {
    const raw = this.parserService.rawJson();
    return this.statsService.calculateStats(raw);
  });

  get formattedSize(): string {
    return this.statsService.formatBytes(this.stats().size);
  }
}
