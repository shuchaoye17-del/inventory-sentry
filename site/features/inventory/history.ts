import { get, set } from 'idb-keyval';

import type {
  InventoryIssue,
  ScanDecision,
  ScanResult,
  StoredScanSummary,
} from './types';

const HISTORY_KEY = 'inventory-sentry:scan-history:v1';
const HISTORY_LIMIT = 100;

const sanitizeIssue = (issue: InventoryIssue): InventoryIssue => ({
  code: issue.code,
  level: issue.level,
  sku: issue.sku,
  rowNumber: issue.rowNumber,
  message: issue.message,
  previousQuantity: issue.previousQuantity,
  currentQuantity: issue.currentQuantity,
  affectedCount: issue.affectedCount,
});

const toStoredSummary = (
  result: ScanResult,
  decision: ScanDecision,
): StoredScanSummary => ({
  id: result.id,
  createdAt: result.createdAt,
  currentFileName: result.currentFileName,
  previousFileName: result.previousFileName,
  shopifyFileName: result.shopifyFileName,
  level: result.level,
  issues: result.issues.map(sanitizeIssue),
  counts: {
    currentRows: result.counts.currentRows,
    matchedRows: result.counts.matchedRows,
    redIssues: result.counts.redIssues,
    yellowIssues: result.counts.yellowIssues,
  },
  decision,
});

export async function saveScanSummary(
  result: ScanResult,
  decision: ScanDecision,
): Promise<void> {
  const existing = await listScanSummaries();
  const next = [
    toStoredSummary(result, decision),
    ...existing.filter((item) => item.id !== result.id),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, HISTORY_LIMIT);
  await set(HISTORY_KEY, next);
}

export async function listScanSummaries(): Promise<StoredScanSummary[]> {
  const saved = await get<StoredScanSummary[]>(HISTORY_KEY);
  if (!Array.isArray(saved)) return [];
  return [...saved].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}
