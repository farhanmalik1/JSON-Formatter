import { Injectable } from '@angular/core';

export type IndentType = '2' | '4' | 'tab';

@Injectable({
  providedIn: 'root'
})
export class JsonFormatterService {
  formatJson(jsonStr: string, indent: IndentType = '2', sortKeys: boolean = false): string {
    if (!jsonStr || !jsonStr.trim()) return '';

    try {
      let parsed = JSON.parse(jsonStr);

      if (sortKeys) {
        parsed = this.sortObjectKeys(parsed);
      }

      const indentStr = indent === 'tab' ? '\t' : parseInt(indent, 10);
      return JSON.stringify(parsed, null, indentStr);
    } catch (e) {
      throw e;
    }
  }

  minifyJson(jsonStr: string): string {
    if (!jsonStr || !jsonStr.trim()) return '';

    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed);
    } catch (e) {
      throw e;
    }
  }

  sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedObj: Record<string, any> = {};
    const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    for (const key of keys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }

    return sortedObj;
  }
}
