import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonStorageService } from '../../core/services/json-storage.service';
import { JsonParserService } from '../../core/services/json-parser.service';
import { JsonStatisticsService } from '../../core/services/json-statistics.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { RecentItem } from '../../core/models/json-node.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-recent-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="recent-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-title">
            <app-icon name="clock" [size]="22" color="#000"></app-icon>
            <h3>Recent Documents History</h3>
          </div>
          <div class="header-actions">
            <button
              *ngIf="storageService.recents().length > 0"
              class="btn-sm btn-pink"
              (click)="clearAll()"
            >
              Clear All
            </button>
            <button class="btn-icon btn-secondary" (click)="close()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <div *ngIf="storageService.recents().length === 0" class="empty-recents">
            <app-icon name="clock" [size]="40" color="#000"></app-icon>
            <p>No recent documents saved yet.</p>
          </div>

          <div class="recents-list" *ngIf="storageService.recents().length > 0">
            <div
              *ngFor="let item of storageService.recents()"
              class="recent-card"
              (click)="reopen(item)"
            >
              <div class="recent-icon">
                <app-icon name="file" [size]="20" color="#000"></app-icon>
              </div>
              <div class="recent-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-sub">
                  {{ formatDate(item.timestamp) }} &bull; {{ statsService.formatBytes(item.size) }}
                </span>
              </div>
              <button
                class="btn-icon delete-btn"
                (click)="deleteItem($event, item.id)"
                [attr.data-tooltip]="'Delete item'"
              >
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .recent-dialog {
      width: 100%;
      max-width: 540px;
      background-color: var(--bg-surface);
      border: 3px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-popup);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background-color: var(--neo-cyan);
      border-bottom: 3px solid var(--border-color);
      color: #000000;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-title h3 {
      font-size: 1.1rem;
      font-weight: 800;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dialog-body {
      padding: 18px;
      max-height: 420px;
      overflow-y: auto;
    }
    .empty-recents {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px;
      font-weight: 700;
      color: var(--text-muted);
    }
    .recents-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .recent-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background-color: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 3px 3px 0px var(--shadow-color);
      cursor: pointer;
      transition: all 0.1s ease;
    }
    .recent-card:hover {
      background-color: var(--neo-yellow);
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0px #000000;
    }
    .recent-card:hover .item-title,
    .recent-card:hover .item-sub {
      color: #000000;
    }
    .recent-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background-color: var(--neo-yellow);
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .recent-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .item-title {
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .item-sub {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .delete-btn {
      border: 1px solid var(--border-color);
    }
  `]
})
export class RecentModalComponent {
  storageService = inject(JsonStorageService);
  parserService = inject(JsonParserService);
  statsService = inject(JsonStatisticsService);
  toastService = inject(ToastService);

  @Output() onClose = new EventEmitter<void>();

  reopen(item: RecentItem) {
    this.parserService.setRawJson(item.json);
    this.toastService.success(`Reopened "${item.title}"`);
    this.close();
  }

  deleteItem(event: Event, id: string) {
    event.stopPropagation();
    this.storageService.removeRecent(id);
  }

  clearAll() {
    if (confirm('Clear all recent history?')) {
      this.storageService.clearAll();
    }
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close() {
    this.onClose.emit();
  }
}
