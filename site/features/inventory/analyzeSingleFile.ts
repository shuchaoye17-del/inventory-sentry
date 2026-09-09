import type { InventoryIssue, InventoryRow } from './types';

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const appendRow = (
  groups: Map<string, InventoryRow[]>,
  key: string,
  row: InventoryRow,
) => {
  const existing = groups.get(key);
  if (existing) {
    existing.push(row);
    return;
  }
  groups.set(key, [row]);
};

export function analyzeSingleFile(rows: InventoryRow[]): InventoryIssue[] {
  const issues: InventoryIssue[] = [];
  const exactSkus = new Map<string, InventoryRow[]>();
  const foldedSkus = new Map<string, InventoryRow[]>();

  for (const row of rows) {
    if (!row.sku) {
      issues.push({
        code: 'EMPTY_SKU',
        level: 'red',
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber} has an empty SKU.`,
      });
    } else {
      appendRow(exactSkus, row.sku, row);
      const folded = row.sku.toLocaleLowerCase();
      appendRow(foldedSkus, folded, row);
    }

    if (isBlank(row.rawQuantity)) {
      issues.push({
        code: 'BLANK_QUANTITY',
        level: 'red',
        sku: row.sku || undefined,
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber} has a blank quantity.`,
      });
      continue;
    }

    if (row.quantity === null) {
      issues.push({
        code: 'INVALID_QUANTITY',
        level: 'red',
        sku: row.sku || undefined,
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber} has a non-numeric quantity.`,
      });
      continue;
    }

    if (!Number.isInteger(row.quantity)) {
      issues.push({
        code: 'NON_INTEGER_QUANTITY',
        level: 'red',
        sku: row.sku || undefined,
        rowNumber: row.rowNumber,
        currentQuantity: row.quantity,
        message: `Row ${row.rowNumber} has a non-integer quantity.`,
      });
    }

    if (row.quantity < 0) {
      issues.push({
        code: 'NEGATIVE_QUANTITY',
        level: 'red',
        sku: row.sku || undefined,
        rowNumber: row.rowNumber,
        currentQuantity: row.quantity,
        message: `Row ${row.rowNumber} has a negative quantity.`,
      });
    }
  }

  for (const [sku, matchingRows] of exactSkus) {
    if (matchingRows.length < 2) continue;
    issues.push({
      code: 'DUPLICATE_SKU',
      level: 'red',
      sku,
      rowNumber: matchingRows[0].rowNumber,
      affectedCount: matchingRows.length,
      message: `${sku} appears ${matchingRows.length} times in the current file.`,
    });
  }

  for (const matchingRows of foldedSkus.values()) {
    const spellings = new Set(matchingRows.map((row) => row.sku));
    if (spellings.size < 2) continue;
    issues.push({
      code: 'CASE_COLLISION',
      level: 'yellow',
      sku: matchingRows[0].sku,
      rowNumber: matchingRows[0].rowNumber,
      affectedCount: matchingRows.length,
      message: `These SKUs differ only by letter case: ${[...spellings].join(', ')}.`,
    });
  }

  return issues;
}
