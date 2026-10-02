import { Injectable } from '@angular/core';
import { DiffItem, AlignedDiffRow, NodeType } from '../models/json-node.model';

@Injectable({
  providedIn: 'root'
})
export class JsonDiffService {
  compareJsons(leftJsonStr: string, rightJsonStr: string): { diffs: DiffItem[]; stats: { added: number; removed: number; modified: number; unchanged: number } } {
    let leftObj: any = null;
    let rightObj: any = null;

    try { leftObj = leftJsonStr ? JSON.parse(leftJsonStr) : null; } catch { leftObj = null; }
    try { rightObj = rightJsonStr ? JSON.parse(rightJsonStr) : null; } catch { rightObj = null; }

    const diffs: DiffItem[] = [];
    const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };

    this.diffRecursive('$', 'root', leftObj, rightObj, 0, diffs, stats);

    return { diffs, stats };
  }

  getAlignedDiffRows(
    leftJsonStr: string,
    rightJsonStr: string,
    expandedStateMap: Map<string, boolean>,
    onlyChanges: boolean = false
  ): { rows: AlignedDiffRow[]; stats: { added: number; removed: number; modified: number; unchanged: number } } {
    let leftObj: any = undefined;
    let rightObj: any = undefined;

    try { if (leftJsonStr && leftJsonStr.trim()) leftObj = JSON.parse(leftJsonStr); } catch { leftObj = undefined; }
    try { if (rightJsonStr && rightJsonStr.trim()) rightObj = JSON.parse(rightJsonStr); } catch { rightObj = undefined; }

    const rows: AlignedDiffRow[] = [];
    const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };

    this.buildAlignedRowsRecursive('$', 'root', leftObj, rightObj, 0, rows, stats, expandedStateMap);

    let filteredRows = rows;
    if (onlyChanges) {
      filteredRows = rows.filter(r => r.status !== 'unchanged' || r.isContainer);
    }

    return { rows: filteredRows, stats };
  }

  private diffRecursive(
    parentPath: string,
    key: string,
    left: any,
    right: any,
    depth: number,
    diffs: DiffItem[],
    stats: { added: number; removed: number; modified: number; unchanged: number }
  ) {
    const path = key === 'root' ? '$' : `${parentPath}.${key}`;
    const leftType = this.getType(left);
    const rightType = this.getType(right);

    if (left === undefined && right !== undefined) {
      diffs.push({
        id: path,
        path,
        key,
        status: 'added',
        newValue: right,
        newType: rightType,
        depth
      });
      stats.added++;
      return;
    }

    if (left !== undefined && right === undefined) {
      diffs.push({
        id: path,
        path,
        key,
        status: 'removed',
        oldValue: left,
        oldType: leftType,
        depth
      });
      stats.removed++;
      return;
    }

    if (leftType !== rightType) {
      diffs.push({
        id: path,
        path,
        key,
        status: 'modified',
        oldValue: left,
        newValue: right,
        oldType: leftType,
        newType: rightType,
        depth
      });
      stats.modified++;
      return;
    }

    if (leftType === 'object' && left !== null && right !== null) {
      const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
      for (const k of allKeys) {
        this.diffRecursive(path, k, left[k], right[k], depth + 1, diffs, stats);
      }
      return;
    }

    if (leftType === 'array') {
      const maxLen = Math.max(left.length, right.length);
      for (let i = 0; i < maxLen; i++) {
        this.diffRecursive(path, `[${i}]`, left[i], right[i], depth + 1, diffs, stats);
      }
      return;
    }

    if (left === right) {
      diffs.push({
        id: path,
        path,
        key,
        status: 'unchanged',
        oldValue: left,
        newValue: right,
        oldType: leftType,
        newType: rightType,
        depth
      });
      stats.unchanged++;
    } else {
      diffs.push({
        id: path,
        path,
        key,
        status: 'modified',
        oldValue: left,
        newValue: right,
        oldType: leftType,
        newType: rightType,
        depth
      });
      stats.modified++;
    }
  }

  private buildAlignedRowsRecursive(
    parentPath: string,
    key: string,
    left: any,
    right: any,
    depth: number,
    rows: AlignedDiffRow[],
    stats: { added: number; removed: number; modified: number; unchanged: number },
    expandedStateMap: Map<string, boolean>
  ) {
    const path = key === 'root' ? '$' : `${parentPath}.${key}`;
    const leftExists = left !== undefined;
    const rightExists = right !== undefined;

    const leftType = leftExists ? this.getType(left) : undefined;
    const rightType = rightExists ? this.getType(right) : undefined;

    let status: 'added' | 'removed' | 'modified' | 'unchanged' = 'unchanged';

    if (!leftExists && rightExists) {
      status = 'added';
      stats.added++;
    } else if (leftExists && !rightExists) {
      status = 'removed';
      stats.removed++;
    } else if (leftType !== rightType) {
      status = 'modified';
      stats.modified++;
    } else if (leftType === 'object' || leftType === 'array') {
      status = 'unchanged';
    } else if (left === right) {
      status = 'unchanged';
      stats.unchanged++;
    } else {
      status = 'modified';
      stats.modified++;
    }

    const isContainer = (leftExists && (leftType === 'object' || leftType === 'array')) ||
                        (rightExists && (rightType === 'object' || rightType === 'array'));

    const containerType = (leftType === 'array' || rightType === 'array') ? 'array' : 'object';

    let childCount = 0;
    if (leftExists && (leftType === 'object' || leftType === 'array')) {
      childCount = leftType === 'array' ? left.length : Object.keys(left).length;
    } else if (rightExists && (rightType === 'object' || rightType === 'array')) {
      childCount = rightType === 'array' ? right.length : Object.keys(right).length;
    }

    const isExpanded = expandedStateMap.has(path) ? expandedStateMap.get(path)! : depth < 2;

    rows.push({
      id: path,
      path,
      key,
      depth,
      status,
      isContainer,
      containerType,
      childCount,
      expanded: isExpanded,
      leftExists,
      leftValue: left,
      leftType,
      rightExists,
      rightValue: right,
      rightType
    });

    if (isContainer && isExpanded) {
      const leftKeys = leftExists && left !== null && typeof left === 'object'
        ? (Array.isArray(left) ? left.map((_, i) => `[${i}]`) : Object.keys(left))
        : [];
      const rightKeys = rightExists && right !== null && typeof right === 'object'
        ? (Array.isArray(right) ? right.map((_, i) => `[${i}]`) : Object.keys(right))
        : [];

      const allKeys: string[] = [];
      const keySet = new Set<string>();

      if (containerType === 'array') {
        const maxLen = Math.max(
          leftExists && Array.isArray(left) ? left.length : 0,
          rightExists && Array.isArray(right) ? right.length : 0
        );
        for (let i = 0; i < maxLen; i++) {
          allKeys.push(`[${i}]`);
        }
      } else {
        for (const k of [...leftKeys, ...rightKeys]) {
          if (!keySet.has(k)) {
            keySet.add(k);
            allKeys.push(k);
          }
        }
      }

      for (const k of allKeys) {
        const childLeft = leftExists && left !== null && typeof left === 'object'
          ? (containerType === 'array' ? left[parseInt(k.replace(/\[|\]/g, ''), 10)] : left[k])
          : undefined;
        const childRight = rightExists && right !== null && typeof right === 'object'
          ? (containerType === 'array' ? right[parseInt(k.replace(/\[|\]/g, ''), 10)] : right[k])
          : undefined;

        this.buildAlignedRowsRecursive(path, k, childLeft, childRight, depth + 1, rows, stats, expandedStateMap);
      }

      rows.push({
        id: `${path}_closing`,
        path,
        key: '',
        depth,
        status: 'unchanged',
        isContainer: false,
        isClosingRow: true,
        closingChar: containerType === 'array' ? ']' : '}',
        leftExists,
        rightExists
      });
    }
  }

  private getType(val: any): NodeType {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val as NodeType;
  }
}
