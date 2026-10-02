import { Injectable, signal } from '@angular/core';
import { RecentItem } from '../models/json-node.model';

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {
  private readonly STORAGE_KEY = 'json_viewer_recents';
  recents = signal<RecentItem[]>(this.loadRecents());

  private loadRecents(): RecentItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveRecent(json: string, title?: string) {
    if (!json || !json.trim()) return;

    try {
      const size = new Blob([json]).size;
      // Auto-generate title if not provided
      let itemTitle = title;
      if (!itemTitle) {
        try {
          const parsed = JSON.parse(json);
          if (typeof parsed === 'object' && parsed !== null) {
            itemTitle = parsed.name || parsed.title || parsed.id || 'JSON Document';
          }
        } catch {
          itemTitle = 'JSON Snippet';
        }
      }

      const newItem: RecentItem = {
        id: Math.random().toString(36).substring(2, 9),
        title: itemTitle || 'JSON Document',
        json,
        size,
        timestamp: Date.now()
      };

      // Keep maximum 15 recent items
      const updated = [newItem, ...this.recents().filter(r => r.json !== json)].slice(0, 15);
      this.recents.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  removeRecent(id: string) {
    const updated = this.recents().filter(r => r.id !== id);
    this.recents.set(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  clearAll() {
    this.recents.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
