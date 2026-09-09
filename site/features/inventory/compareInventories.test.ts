import { describe, expect, it } from 'vitest';

import { compareInventories } from './compareInventories';
import { DEFAULT_THRESHOLDS } from './risk';
import type { ParsedInventoryFile } from './types';

const inventory = (
  values: Array<[string, number]>,
  headers = ['SKU', 'Qty'],
): ParsedInventoryFile => ({
  fileName: 'inventory.csv',
  headers,
  skuColumn: 'SKU',
  quantityColumn: headers.includes('Qty') ? 'Qty' : headers[1],
  rows: values.map(([sku, quantity], index) => ({
    rowNumber: index + 2,
    sku,
    quantity,
    rawSku: sku,
    rawQuantity: quantity,
  })),
});

const issueCodes = (
  current: ParsedInventoryFile,
  previous: ParsedInventoryFile,
) =>
  compareInventories(current, previous, DEFAULT_THRESHOLDS).map(
    (issue) => issue.code,
  );

describe('known-good inventory comparison', () => {
  it('marks a qualifying large drop red with before and after values', () => {
    const issues = compareInventories(
      inventory([['A', 10]]),
      inventory([['A', 100]]),
      DEFAULT_THRESHOLDS,
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'LARGE_DROP',
        level: 'red',
        sku: 'A',
        previousQuantity: 100,
        currentQuantity: 10,
      }),
    );
  });

  it('does not flag a large change when only the absolute threshold is crossed', () => {
    expect(
      issueCodes(inventory([['A', 89]]), inventory([['A', 100]])),
    ).not.toContain('LARGE_DROP');
  });

  it('does not flag a large change when only the percentage threshold is crossed', () => {
    expect(
      issueCodes(inventory([['A', 1]]), inventory([['A', 9]])),
    ).not.toContain('LARGE_DROP');
  });

  it('reports schema drift independent of column order', () => {
    expect(
      issueCodes(
        inventory([['A', 1]], ['Qty', 'SKU', 'Warehouse']),
        inventory([['A', 1]], ['SKU', 'Qty']),
      ),
    ).toContain('SCHEMA_DRIFT');
    expect(
      issueCodes(
        inventory([['A', 1]], ['Qty', 'SKU']),
        inventory([['A', 1]], ['SKU', 'Qty']),
      ),
    ).not.toContain('SCHEMA_DRIFT');
  });

  it('reports missing, new, zeroed, and large-increase SKUs as reviewable detail', () => {
    const codes = issueCodes(
      inventory([
        ['ZERO', 0],
        ['NEW', 5],
        ['UP', 100],
      ]),
      inventory([
        ['ZERO', 5],
        ['MISSING', 7],
        ['UP', 10],
      ]),
    );

    expect(codes).toEqual(
      expect.arrayContaining([
        'MISSING_SKU',
        'NEW_SKU',
        'ZEROED_SKU',
        'LARGE_INCREASE',
      ]),
    );
  });

  it('escalates mass zeroing only when count and percentage thresholds cross', () => {
    const previous = inventory(
      Array.from({ length: 100 }, (_, index) => [`SKU-${index}`, 10]),
    );
    const current = inventory(
      Array.from({ length: 100 }, (_, index) => [
        `SKU-${index}`,
        index < 20 ? 0 : 10,
      ]),
    );
    const belowCount = inventory(
      Array.from({ length: 100 }, (_, index) => [
        `SKU-${index}`,
        index < 19 ? 0 : 10,
      ]),
    );

    expect(issueCodes(current, previous)).toContain('MASS_ZEROING');
    expect(issueCodes(belowCount, previous)).not.toContain('MASS_ZEROING');
  });

  it('escalates mass missing against the previous valid SKU count', () => {
    const previous = inventory(
      Array.from({ length: 100 }, (_, index) => [`SKU-${index}`, 10]),
    );
    const current = inventory(
      Array.from({ length: 80 }, (_, index) => [`SKU-${index}`, 10]),
    );
    const issue = compareInventories(
      current,
      previous,
      DEFAULT_THRESHOLDS,
    ).find((candidate) => candidate.code === 'MASS_MISSING');

    expect(issue).toEqual(
      expect.objectContaining({ level: 'red', affectedCount: 20 }),
    );
  });

  it('reports mass new as yellow against the current valid SKU count', () => {
    const previous = inventory(
      Array.from({ length: 80 }, (_, index) => [`SKU-${index}`, 10]),
    );
    const current = inventory(
      Array.from({ length: 100 }, (_, index) => [`SKU-${index}`, 10]),
    );
    const issue = compareInventories(
      current,
      previous,
      DEFAULT_THRESHOLDS,
    ).find((candidate) => candidate.code === 'MASS_NEW');

    expect(issue).toEqual(
      expect.objectContaining({ level: 'yellow', affectedCount: 20 }),
    );
  });
});
