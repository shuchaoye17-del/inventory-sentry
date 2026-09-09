export type RiskLevel = 'green' | 'yellow' | 'red';

export type RawTable = {
  headers: string[];
  rows: Record<string, unknown>[];
};

export type InventoryRow = {
  rowNumber: number;
  sku: string;
  quantity: number | null;
  rawSku: unknown;
  rawQuantity: unknown;
};

export type ParsedInventoryFile = {
  fileName: string;
  headers: string[];
  rows: InventoryRow[];
  skuColumn: string;
  quantityColumn: string;
};

export type IssueCode =
  | 'EMPTY_SKU'
  | 'DUPLICATE_SKU'
  | 'CASE_COLLISION'
  | 'BLANK_QUANTITY'
  | 'INVALID_QUANTITY'
  | 'NON_INTEGER_QUANTITY'
  | 'NEGATIVE_QUANTITY'
  | 'SCHEMA_DRIFT'
  | 'MISSING_SKU'
  | 'NEW_SKU'
  | 'ZEROED_SKU'
  | 'LARGE_DROP'
  | 'LARGE_INCREASE'
  | 'MASS_ZEROING'
  | 'MASS_MISSING'
  | 'MASS_NEW'
  | 'UNKNOWN_SHOPIFY_SKU'
  | 'DUPLICATE_SHOPIFY_SKU';

export type InventoryIssue = {
  code: IssueCode;
  level: Exclude<RiskLevel, 'green'>;
  sku?: string;
  rowNumber?: number;
  message: string;
  previousQuantity?: number;
  currentQuantity?: number;
  affectedCount?: number;
};

export type AnalysisThresholds = {
  largeChangePercent: number;
  largeChangeAbsolute: number;
  massZeroCount: number;
  massZeroPercent: number;
  massMissingCount: number;
  massMissingPercent: number;
  massNewCount: number;
  massNewPercent: number;
};

export type ScanResult = {
  id: string;
  createdAt: string;
  currentFileName: string;
  previousFileName?: string;
  shopifyFileName?: string;
  level: RiskLevel;
  issues: InventoryIssue[];
  counts: {
    currentRows: number;
    matchedRows: number;
    redIssues: number;
    yellowIssues: number;
  };
};

export type ScanDecision = 'approved' | 'rejected' | 'undecided';

export type StoredScanSummary = ScanResult & {
  decision: ScanDecision;
};
