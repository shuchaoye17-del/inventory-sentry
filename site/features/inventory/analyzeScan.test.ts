import { describe, expect, it } from 'vitest';

import { analyzeScan } from './analyzeScan';
import { DEFAULT_THRESHOLDS } from './risk';
import type { ParsedInventoryFile } from './types';

const inventory = (
  fileName: string,
  values: Array<[string, number]>,
): ParsedInventoryFile => ({
  fileName,
  headers: ['SKU', 'Qty'],
  skuColumn: 'SKU',
  quantityColumn: 'Qty',
  rows: values.map(([sku, quantity], index) => ({
    rowNumber: index + 2,
    sku,
    quantity,
    rawSku: sku,
    rawQuantity: quantity,
  })),
});

describe('scan analysis orchestration', () => {
  it('combines current, previous, and Shopify checks into one red result', () => {
    const result = analyzeScan({
      current: inventory('current.csv', [
        ['A', 1],
        ['A', 2],
        ['UNKNOWN', 3],
      ]),
      previous: inventory('previous.csv', [
        ['A', 100],
        ['MISSING', 5],
      ]),
      shopifySkus: ['A'],
      shopifyFileName: 'shopify.csv',
      thresholds: DEFAULT_THRESHOLDS,
    });

    expect(result).toEqual(
      expect.objectContaining({
        currentFileName: 'current.csv',
        previousFileName: 'previous.csv',
        shopifyFileName: 'shopify.csv',
        level: 'red',
        counts: {
          currentRows: 3,
          matchedRows: 1,
          redIssues: 2,
          yellowIssues: 3,
        },
      }),
    );
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'DUPLICATE_SKU',
        'LARGE_DROP',
        'MISSING_SKU',
        'NEW_SKU',
        'UNKNOWN_SHOPIFY_SKU',
      ]),
    );
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
  });

  it('returns green for a clean standalone current file', () => {
    const result = analyzeScan({
      current: inventory('clean.csv', [['A', 12]]),
      thresholds: DEFAULT_THRESHOLDS,
    });

    expect(result.level).toBe('green');
    expect(result.issues).toEqual([]);
    expect(result.counts).toEqual({
      currentRows: 1,
      matchedRows: 0,
      redIssues: 0,
      yellowIssues: 0,
    });
  });
});
