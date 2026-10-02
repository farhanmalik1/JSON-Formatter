import { Injectable } from '@angular/core';
import { JsonStats } from '../models/json-node.model';

@Injectable({
  providedIn: 'root'
})
export class JsonStatisticsService {
  calculateStats(jsonStr: string, parsedValue?: any): JsonStats {
    const stats: JsonStats = {
      objects: 0,
      arrays: 0,
      keys: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      depth: 0,
      size: new Blob([jsonStr || '']).size
    };

    if (!jsonStr || !jsonStr.trim()) return stats;

    let target = parsedValue;
    if (target === undefined) {
      try {
        target = JSON.parse(jsonStr);
      } catch {
        return stats;
      }
    }

    this.traverse(target, 1, stats);
    return stats;
  }

  private traverse(node: any, currentDepth: number, stats: JsonStats) {
    if (currentDepth > stats.depth) {
      stats.depth = currentDepth;
    }

    if (node === null) {
      stats.nulls++;
      return;
    }

    const type = typeof node;

    if (type === 'string') {
      stats.strings++;
    } else if (type === 'number') {
      stats.numbers++;
    } else if (type === 'boolean') {
      stats.booleans++;
    } else if (Array.isArray(node)) {
      stats.arrays++;
      for (const item of node) {
        this.traverse(item, currentDepth + 1, stats);
      }
    } else if (type === 'object') {
      stats.objects++;
      const keys = Object.keys(node);
      stats.keys += keys.length;
      for (const k of keys) {
        this.traverse(node[k], currentDepth + 1, stats);
      }
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
