import type {
  AnalysisThresholds,
  InventoryIssue,
  InventoryRow,
  ParsedInventoryFile,
} from './types';

const validRowsBySku = (rows: InventoryRow[]) =>
  new Map(
    rows
      .filter((row) => row.sku && row.quantity !== null)
      .map((row) => [row.sku, row] as const),
  );

const sameHeaderSet = (current: string[], previous: string[]) => {
  if (current.length !== previous.length) return false;
  const previousHeaders = new Set(previous);
  return current.every((header) => previousHeaders.has(header));
};

const crossesLargeChange = (
  previous: number,
  current: number,
  thresholds: AnalysisThresholds,
) => {
  const absolute = Math.abs(current - previous);
  const percent = absolute / Math.max(previous, 1);
  return (
    absolute >= thresholds.largeChangeAbsolute &&
    percent >= thresholds.largeChangePercent
  );
};

const crossesMassThreshold = (
  count: number,
  denominator: number,
  minimumCount: number,
  minimumPercent: number,
) =>
  count >= minimumCount &&
  denominator > 0 &&
  count / denominator >= minimumPercent;

export function compareInventories(
  current: ParsedInventoryFile,
  previous: ParsedInventoryFile,
  thresholds: AnalysisThresholds,
): InventoryIssue[] {
  const issues: InventoryIssue[] = [];
  const currentBySku = validRowsBySku(current.rows);
  const previousBySku = validRowsBySku(previous.rows);

  if (!sameHeaderSet(current.headers, previous.headers)) {
    issues.push({
      code: 'SCHEMA_DRIFT',
      level: 'yellow',
      message: 'The current file uses a different set of columns.',
    });
  }

  const missing: InventoryRow[] = [];
  for (const [sku, previousRow] of previousBySku) {
    if (currentBySku.has(sku)) continue;
    missing.push(previousRow);
    issues.push({
      code: 'MISSING_SKU',
      level: 'yellow',
      sku,
      previousQuantity: previousRow.quantity ?? undefined,
      message: `${sku} was present previously but is missing now.`,
    });
  }

  const added: InventoryRow[] = [];
  for (const [sku, currentRow] of currentBySku) {
    if (previousBySku.has(sku)) continue;
    added.push(currentRow);
    issues.push({
      code: 'NEW_SKU',
      level: 'yellow',
      sku,
      currentQuantity: currentRow.quantity ?? undefined,
      message: `${sku} is new in the current file.`,
    });
  }

  const zeroed: InventoryRow[] = [];
  for (const [sku, currentRow] of currentBySku) {
    const previousRow = previousBySku.get(sku);
    if (!previousRow) continue;
    const previousQuantity = previousRow.quantity;
    const currentQuantity = currentRow.quantity;
    if (previousQuantity === null || currentQuantity === null) continue;

    if (previousQuantity > 0 && currentQuantity === 0) {
      zeroed.push(currentRow);
      issues.push({
        code: 'ZEROED_SKU',
        level: 'yellow',
        sku,
        previousQuantity,
        currentQuantity,
        message: `${sku} changed from ${previousQuantity} to zero.`,
      });
    }

    if (!crossesLargeChange(previousQuantity, currentQuantity, thresholds)) {
      continue;
    }

    if (currentQuantity < previousQuantity && previousQuantity >= 10) {
      issues.push({
        code: 'LARGE_DROP',
        level: 'red',
        sku,
        previousQuantity,
        currentQuantity,
        message: `${sku} dropped from ${previousQuantity} to ${currentQuantity}.`,
      });
    } else if (currentQuantity > previousQuantity) {
      issues.push({
        code: 'LARGE_INCREASE',
        level: 'yellow',
        sku,
        previousQuantity,
        currentQuantity,
        message: `${sku} increased from ${previousQuantity} to ${currentQuantity}.`,
      });
    }
  }

  if (
    crossesMassThreshold(
      zeroed.length,
      previousBySku.size,
      thresholds.massZeroCount,
      thresholds.massZeroPercent,
    )
  ) {
    issues.push({
      code: 'MASS_ZEROING',
      level: 'red',
      affectedCount: zeroed.length,
      message: `${zeroed.length} SKUs were zeroed at once.`,
    });
  }

  if (
    crossesMassThreshold(
      missing.length,
      previousBySku.size,
      thresholds.massMissingCount,
      thresholds.massMissingPercent,
    )
  ) {
    issues.push({
      code: 'MASS_MISSING',
      level: 'red',
      affectedCount: missing.length,
      message: `${missing.length} previously known SKUs are missing.`,
    });
  }

  if (
    crossesMassThreshold(
      added.length,
      currentBySku.size,
      thresholds.massNewCount,
      thresholds.massNewPercent,
    )
  ) {
    issues.push({
      code: 'MASS_NEW',
      level: 'yellow',
      affectedCount: added.length,
      message: `${added.length} SKUs are new in this file.`,
    });
  }

  return issues;
}
