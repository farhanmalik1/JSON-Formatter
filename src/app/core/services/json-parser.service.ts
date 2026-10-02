import { Injectable, signal, computed } from '@angular/core';
import { TreeNode, NodeType, ValidationResult, SearchOptions, FilterType } from '../models/json-node.model';

@Injectable({
  providedIn: 'root'
})
export class JsonParserService {
  rawJson = signal<string>('');
  validationResult = signal<ValidationResult>({ valid: true });
  nodesMap = signal<Map<string, TreeNode>>(new Map());
  rootId = signal<string | null>(null);
  selectedNodeId = signal<string | null>(null);
  filterType = signal<FilterType>('all');
  
  // Search state
  searchOptions = signal<SearchOptions>({
    query: '',
    searchKeys: true,
    searchValues: true,
    searchPaths: false,
    caseSensitive: false,
    wholeWord: false
  });

  searchResults = signal<string[]>([]);
  currentSearchIndex = signal<number>(-1);

  // Computed visible flattened nodes list including closing brackets
  flattenedNodes = computed(() => {
    const map = this.nodesMap();
    const rootId = this.rootId();
    const filter = this.filterType();
    const searchMatches = new Set(this.searchResults());

    if (!rootId || !map.has(rootId)) return [];

    const result: TreeNode[] = [];
    const rootNode = map.get(rootId)!;

    this.flattenTree(rootNode, map, result, filter, searchMatches);
    return result;
  });

  setRawJson(jsonStr: string) {
    this.rawJson.set(jsonStr);
    this.parseAndBuildTree(jsonStr);
  }

  parseAndBuildTree(jsonStr: string) {
    if (!jsonStr || !jsonStr.trim()) {
      this.validationResult.set({ valid: true });
      this.nodesMap.set(new Map());
      this.rootId.set(null);
      this.selectedNodeId.set(null);
      this.searchResults.set([]);
      this.currentSearchIndex.set(-1);
      return;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      this.validationResult.set({ valid: true });

      const newMap = new Map<string, TreeNode>();
      const rootId = '$';

      this.buildNode('$', 'root', parsed, null, 0, newMap);

      this.nodesMap.set(newMap);
      this.rootId.set(rootId);
      
      if (this.searchOptions().query) {
        this.performSearch();
      }
    } catch (err: any) {
      const errorInfo = this.extractSyntaxErrorDetails(jsonStr, err);
      this.validationResult.set({
        valid: false,
        error: errorInfo.message,
        line: errorInfo.line,
        column: errorInfo.column
      });
    }
  }

  private extractSyntaxErrorDetails(str: string, err: Error): { message: string; line?: number; column?: number } {
    let line = 1;
    let column = 1;
    let message = err.message || 'Invalid JSON syntax';

    const posMatch = message.match(/position (\d+)/i);
    const lineColMatch = message.match(/line (\d+) column (\d+)/i);

    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = str.substring(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    return { message, line, column };
  }

  private buildNode(
    path: string,
    key: string | number,
    val: any,
    parentId: string | null,
    depth: number,
    map: Map<string, TreeNode>
  ): TreeNode {
    const id = path;
    const type = this.getNodeType(val);

    const childrenIds: string[] = [];
    let childrenCount = 0;

    if (type === 'object' && val !== null) {
      const keys = Object.keys(val);
      childrenCount = keys.length;
      for (const k of keys) {
        const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
        const childNode = this.buildNode(childPath, k, val[k], id, depth + 1, map);
        childrenIds.push(childNode.id);
      }
    } else if (type === 'array') {
      childrenCount = val.length;
      for (let i = 0; i < val.length; i++) {
        const childPath = `${path}[${i}]`;
        const childNode = this.buildNode(childPath, i, val[i], id, depth + 1, map);
        childrenIds.push(childNode.id);
      }
    }

    const node: TreeNode = {
      id,
      key,
      value: val,
      type,
      path,
      depth,
      parentId,
      childrenIds,
      childrenCount,
      expanded: depth < 2, // Expand root and first level by default
      visible: true,
      isRoot: path === '$'
    };

    map.set(id, node);
    return node;
  }

  private getNodeType(val: any): NodeType {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val as NodeType;
  }

  private flattenTree(
    node: TreeNode,
    map: Map<string, TreeNode>,
    result: TreeNode[],
    filter: FilterType,
    searchMatches: Set<string>
  ) {
    const matchesType = filter === 'all' || node.type === filter || node.type === 'object' || node.type === 'array';
    
    if (matchesType) {
      node.matched = searchMatches.has(node.id);
      result.push(node);
    }

    if (node.expanded && (node.type === 'object' || node.type === 'array')) {
      for (let i = 0; i < node.childrenIds.length; i++) {
        const childId = node.childrenIds[i];
        const childNode = map.get(childId);
        if (childNode) {
          childNode.isLastChild = (i === node.childrenIds.length - 1);
          this.flattenTree(childNode, map, result, filter, searchMatches);
        }
      }

      // Add matching closing bracket row for expanded containers!
      if (matchesType) {
        const closingChar = node.type === 'object' ? '}' : ']';
        const closingNode: TreeNode = {
          id: `${node.id}_closing`,
          key: '',
          value: null,
          type: node.type,
          path: node.path,
          depth: node.depth,
          parentId: node.id,
          childrenIds: [],
          childrenCount: 0,
          expanded: false,
          visible: true,
          isClosing: true,
          closingChar,
          closingForId: node.id
        };
        result.push(closingNode);
      }
    }
  }

  // Expansion actions
  toggleExpand(id: string) {
    const targetId = id.endsWith('_closing') ? id.replace('_closing', '') : id;
    const map = new Map(this.nodesMap());
    const node = map.get(targetId);
    if (node) {
      node.expanded = !node.expanded;
      this.nodesMap.set(map);
    }
  }

  expandAll() {
    const map = new Map(this.nodesMap());
    for (const node of map.values()) {
      if (node.type === 'object' || node.type === 'array') {
        node.expanded = true;
      }
    }
    this.nodesMap.set(map);
  }

  collapseAll() {
    const map = new Map(this.nodesMap());
    for (const node of map.values()) {
      if (node.type === 'object' || node.type === 'array') {
        node.expanded = node.isRoot || false;
      }
    }
    this.nodesMap.set(map);
  }

  expandToDepth(targetDepth: number) {
    const map = new Map(this.nodesMap());
    for (const node of map.values()) {
      if (node.type === 'object' || node.type === 'array') {
        node.expanded = node.depth <= targetDepth;
      }
    }
    this.nodesMap.set(map);
  }

  selectNode(id: string | null) {
    const targetId = id && id.endsWith('_closing') ? id.replace('_closing', '') : id;
    this.selectedNodeId.set(targetId);
  }

  // Node Mutations & Edits
  updateNodeValue(id: string, newValue: any) {
    const map = this.nodesMap();
    const node = map.get(id);
    if (!node) return;

    let parsedVal = newValue;
    if (node.type === 'number') {
      parsedVal = Number(newValue);
      if (isNaN(parsedVal)) parsedVal = 0;
    } else if (node.type === 'boolean') {
      parsedVal = String(newValue) === 'true';
    } else if (node.type === 'null') {
      parsedVal = null;
    }

    this.mutateTreeAndSync((rootObj) => {
      this.setValueByPath(rootObj, node.path, parsedVal);
    });
  }

  deleteNode(id: string) {
    const map = this.nodesMap();
    const node = map.get(id);
    if (!node || node.isRoot) return;

    this.mutateTreeAndSync((rootObj) => {
      this.deleteByPath(rootObj, node.path);
    });
  }

  duplicateNode(id: string) {
    const map = this.nodesMap();
    const node = map.get(id);
    if (!node || node.isRoot || !node.parentId) return;

    const parentNode = map.get(node.parentId);
    if (!parentNode) return;

    this.mutateTreeAndSync((rootObj) => {
      if (parentNode.type === 'array') {
        const arr = this.getValueByPath(rootObj, parentNode.path);
        if (Array.isArray(arr) && typeof node.key === 'number') {
          const itemCopy = JSON.parse(JSON.stringify(arr[node.key]));
          arr.splice(node.key + 1, 0, itemCopy);
        }
      } else if (parentNode.type === 'object') {
        const obj = this.getValueByPath(rootObj, parentNode.path);
        if (obj && typeof node.key === 'string') {
          const newKey = `${node.key}_copy`;
          obj[newKey] = JSON.parse(JSON.stringify(obj[node.key]));
        }
      }
    });
  }

  addProperty(parentId: string, key: string, value: any, type: NodeType) {
    const map = this.nodesMap();
    const parentNode = map.get(parentId);
    if (!parentNode) return;

    this.mutateTreeAndSync((rootObj) => {
      const targetObj = this.getValueByPath(rootObj, parentNode.path);
      if (parentNode.type === 'object' && targetObj) {
        targetObj[key] = this.formatTypedValue(value, type);
      } else if (parentNode.type === 'array' && Array.isArray(targetObj)) {
        targetObj.push(this.formatTypedValue(value, type));
      }
    });
  }

  renameProperty(id: string, newKey: string) {
    const map = this.nodesMap();
    const node = map.get(id);
    if (!node || node.isRoot || !node.parentId || typeof node.key !== 'string') return;

    const parentNode = map.get(node.parentId);
    if (!parentNode || parentNode.type !== 'object') return;

    this.mutateTreeAndSync((rootObj) => {
      const obj = this.getValueByPath(rootObj, parentNode.path);
      if (obj && node.key in obj) {
        const value = obj[node.key as string];
        delete obj[node.key as string];
        obj[newKey] = value;
      }
    });
  }

  private formatTypedValue(val: any, type: NodeType): any {
    if (type === 'string') return String(val || '');
    if (type === 'number') return Number(val) || 0;
    if (type === 'boolean') return String(val) === 'true';
    if (type === 'null') return null;
    if (type === 'object') return {};
    if (type === 'array') return [];
    return val;
  }

  private mutateTreeAndSync(mutationFn: (rootObj: any) => void) {
    try {
      const rootObj = JSON.parse(this.rawJson());
      mutationFn(rootObj);
      const updatedJson = JSON.stringify(rootObj, null, 2);
      this.setRawJson(updatedJson);
    } catch (e) {
      console.error('Mutation failed', e);
    }
  }

  private getValueByPath(obj: any, path: string): any {
    if (path === '$') return obj;
    const tokens = this.parsePathTokens(path);
    let curr = obj;
    for (const token of tokens) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[token];
    }
    return curr;
  }

  private setValueByPath(obj: any, path: string, value: any) {
    if (path === '$') return;
    const tokens = this.parsePathTokens(path);
    let curr = obj;
    for (let i = 0; i < tokens.length - 1; i++) {
      curr = curr[tokens[i]];
    }
    curr[tokens[tokens.length - 1]] = value;
  }

  private deleteByPath(obj: any, path: string) {
    if (path === '$') return;
    const tokens = this.parsePathTokens(path);
    let curr = obj;
    for (let i = 0; i < tokens.length - 1; i++) {
      curr = curr[tokens[i]];
    }
    const last = tokens[tokens.length - 1];
    if (Array.isArray(curr) && typeof last === 'number') {
      curr.splice(last, 1);
    } else {
      delete curr[last];
    }
  }

  private parsePathTokens(path: string): (string | number)[] {
    const tokens: (string | number)[] = [];
    const parts = path.replace(/^\$\.?/, '').split(/\.|\b(?=\[)/);

    for (const p of parts) {
      if (!p) continue;
      const arrayMatch = p.match(/^\[(\d+)\]$/);
      if (arrayMatch) {
        tokens.push(parseInt(arrayMatch[1], 10));
      } else {
        tokens.push(p);
      }
    }
    return tokens;
  }

  // Search Engine
  setSearchOptions(options: Partial<SearchOptions>) {
    this.searchOptions.update(opt => ({ ...opt, ...options }));
    this.performSearch();
  }

  performSearch() {
    const opt = this.searchOptions();
    const query = opt.query.trim();

    if (!query) {
      this.searchResults.set([]);
      this.currentSearchIndex.set(-1);
      return;
    }

    const map = this.nodesMap();
    const matches: string[] = [];
    const regexFlags = opt.caseSensitive ? 'g' : 'gi';

    let pattern: RegExp;
    try {
      if (opt.wholeWord) {
        pattern = new RegExp(`\\b${this.escapeRegex(query)}\\b`, regexFlags);
      } else {
        pattern = new RegExp(this.escapeRegex(query), regexFlags);
      }
    } catch {
      return;
    }

    for (const node of map.values()) {
      let isMatch = false;

      if (opt.searchKeys && node.key !== undefined) {
        if (pattern.test(String(node.key))) {
          isMatch = true;
          node.matchedInKey = true;
        }
      }

      if (opt.searchValues && node.type !== 'object' && node.type !== 'array') {
        if (pattern.test(String(node.value))) {
          isMatch = true;
          node.matchedInValue = true;
        }
      }

      if (opt.searchPaths) {
        if (pattern.test(node.path)) {
          isMatch = true;
          node.matchedInPath = true;
        }
      }

      if (isMatch) {
        matches.push(node.id);
        this.expandAncestors(node.parentId, map);
      }
    }

    this.searchResults.set(matches);
    this.currentSearchIndex.set(matches.length > 0 ? 0 : -1);

    if (matches.length > 0) {
      this.selectNode(matches[0]);
    }
  }

  private expandAncestors(parentId: string | null, map: Map<string, TreeNode>) {
    let currId = parentId;
    while (currId && map.has(currId)) {
      const parent = map.get(currId)!;
      parent.expanded = true;
      currId = parent.parentId;
    }
  }

  nextMatch() {
    const matches = this.searchResults();
    if (matches.length === 0) return;
    const nextIdx = (this.currentSearchIndex() + 1) % matches.length;
    this.currentSearchIndex.set(nextIdx);
    this.selectNode(matches[nextIdx]);
  }

  previousMatch() {
    const matches = this.searchResults();
    if (matches.length === 0) return;
    const prevIdx = (this.currentSearchIndex() - 1 + matches.length) % matches.length;
    this.currentSearchIndex.set(prevIdx);
    this.selectNode(matches[prevIdx]);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
