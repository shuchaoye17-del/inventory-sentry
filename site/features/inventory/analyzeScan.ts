import { analyzeSingleFile } from './analyzeSingleFile';
import { compareInventories } from './compareInventories';
import { compareShopifySkus } from './compareShopifyExport';
import { highestRisk } from './risk';
import type {
  AnalysisThresholds,
  ParsedInventoryFile,
  ScanResult,
} from './types';

export type AnalyzeScanInput = {
  current: ParsedInventoryFile;
  previous?: ParsedInventoryFile;
  shopifySkus?: string[];
  shopifyFileName?: string;
  thresholds: AnalysisThresholds;
};

const matchedRowCount = (
  current: ParsedInventoryFile,
  previous?: ParsedInventoryFile,
) => {
  if (!previous) return 0;
  const previousSkus = new Set(
    previous.rows.filter((row) => row.sku).map((row) => row.sku),
  );
  return new Set(
    current.rows
      .filter((row) => row.sku && previousSkus.has(row.sku))
      .map((row) => row.sku),
  ).size;
};

export function analyzeScan(input: AnalyzeScanInput): ScanResult {
  const issues = analyzeSingleFile(input.current.rows);
  if (input.previous) {
    issues.push(
      ...compareInventories(
        input.current,
        input.previous,
        input.thresholds,
      ),
    );
  }
  if (input.shopifySkus) {
    issues.push(...compareShopifySkus(input.current.rows, input.shopifySkus));
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currentFileName: input.current.fileName,
    previousFileName: input.previous?.fileName,
    shopifyFileName: input.shopifyFileName,
    level: highestRisk(issues),
    issues,
    counts: {
      currentRows: input.current.rows.length,
      matchedRows: matchedRowCount(input.current, input.previous),
      redIssues: issues.filter((issue) => issue.level === 'red').length,
      yellowIssues: issues.filter((issue) => issue.level === 'yellow').length,
    },
  };
}
