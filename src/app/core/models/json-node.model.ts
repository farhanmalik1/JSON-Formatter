export type NodeType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface TreeNode {
  id: string;
  key: string | number;
  value: any;
  type: NodeType;
  path: string;
  depth: number;
  parentId: string | null;
  childrenIds: string[];
  childrenCount: number;
  expanded: boolean;
  visible: boolean;
  matched?: boolean;
  matchedInKey?: boolean;
  matchedInValue?: boolean;
  matchedInPath?: boolean;
  selected?: boolean;
  isRoot?: boolean;
  isLastChild?: boolean;

  // Closing bracket row properties
  isClosing?: boolean;
  closingChar?: '}' | ']';
  closingForId?: string;
}

export interface JsonStats {
  objects: number;
  arrays: number;
  keys: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  depth: number;
  size: number;
}

export interface SearchOptions {
  query: string;
  searchKeys: boolean;
  searchValues: boolean;
  searchPaths: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export type FilterType = 'all' | 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface DiffItem {
  id: string;
  path: string;
  key: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
  oldType?: NodeType;
  newType?: NodeType;
  depth: number;
}

export interface AlignedDiffRow {
  id: string;
  path: string;
  key: string;
  depth: number;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  isContainer?: boolean;
  containerType?: 'object' | 'array';
  childCount?: number;
  expanded?: boolean;
  isClosingRow?: boolean;
  closingChar?: '}' | ']';
  leftExists: boolean;
  leftValue?: any;
  leftType?: NodeType;
  rightExists: boolean;
  rightValue?: any;
  rightType?: NodeType;
}

export interface RecentItem {
  id: string;
  title: string;
  json: string;
  size: number;
  timestamp: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}
