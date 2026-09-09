import { describe, expect, it } from 'vitest';

import { analyzeSingleFile } from './analyzeSingleFile';
import { mapInventoryRows } from './mapRows';

const issuesFor = (sku: unknown, quantity: unknown) =>
  analyzeSingleFile(
    mapInventoryRows(
      {
        headers: ['SKU', 'Qty'],
        rows: [{ SKU: sku, Qty: quantity }],
      },
      'SKU',
      'Qty',
    ),
  );

describe('current inventory mapping and validation', () => {
  it('trims SKUs and preserves raw input alongside numeric quantity', () => {
    expect(
      mapInventoryRows(
        {
          headers: ['SKU', 'Qty'],
          rows: [{ SKU: '  A-1  ', Qty: '12' }],
        },
        'SKU',
        'Qty',
      ),
    ).toEqual([
      {
        rowNumber: 2,
        sku: 'A-1',
        quantity: 12,
        rawSku: '  A-1  ',
        rawQuantity: '12',
      },
    ]);
  });

  it('rejects missing or identical mapped columns', () => {
    const table = { headers: ['SKU', 'Qty'], rows: [{ SKU: 'A', Qty: 1 }] };

    expect(() => mapInventoryRows(table, 'SKU', 'SKU')).toThrow(/different/i);
    expect(() => mapInventoryRows(table, 'Missing', 'Qty')).toThrow(/valid/i);
  });

  it('does not turn structured cells into [object Object] SKUs', () => {
    const rows = mapInventoryRows(
      {
        headers: ['SKU', 'Qty'],
        rows: [{ SKU: { nested: 'A' }, Qty: 1 }],
      },
      'SKU',
      'Qty',
    );

    expect(rows[0].sku).toBe('');
    expect(analyzeSingleFile(rows)).toContainEqual(
      expect.objectContaining({ code: 'EMPTY_SKU', level: 'red' }),
    );
  });

  it.each([
    ['', 4, 'EMPTY_SKU'],
    ['A', '', 'BLANK_QUANTITY'],
    ['A', 'many', 'INVALID_QUANTITY'],
    ['A', '1.5', 'NON_INTEGER_QUANTITY'],
    ['A', '-1', 'NEGATIVE_QUANTITY'],
  ] as const)('maps %s/%s to %s', (sku, quantity, code) => {
    expect(issuesFor(sku, quantity).map((issue) => issue.code)).toContain(
      code,
    );
  });

  it('reports an exact duplicate after SKU trimming', () => {
    const rows = mapInventoryRows(
      {
        headers: ['SKU', 'Qty'],
        rows: [
          { SKU: ' A ', Qty: 2 },
          { SKU: 'A', Qty: 3 },
        ],
      },
      'SKU',
      'Qty',
    );

    expect(analyzeSingleFile(rows)).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_SKU',
        level: 'red',
        sku: 'A',
        affectedCount: 2,
      }),
    );
  });

  it('reports a case-only collision without treating exact repeats as case collisions', () => {
    const rows = mapInventoryRows(
      {
        headers: ['SKU', 'Qty'],
        rows: [
          { SKU: 'A-1', Qty: 2 },
          { SKU: 'a-1', Qty: 3 },
          { SKU: 'A-1', Qty: 4 },
        ],
      },
      'SKU',
      'Qty',
    );
    const issues = analyzeSingleFile(rows);

    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'CASE_COLLISION', level: 'yellow' }),
    );
    expect(
      issues.filter((issue) => issue.code === 'CASE_COLLISION'),
    ).toHaveLength(1);
  });

  it('returns no issues for valid non-negative integer inventory', () => {
    const rows = mapInventoryRows(
      {
        headers: ['SKU', 'Qty'],
        rows: [
          { SKU: 'A', Qty: 0 },
          { SKU: 'B', Qty: 12 },
        ],
      },
      'SKU',
      'Qty',
    );

    expect(analyzeSingleFile(rows)).toEqual([]);
  });

  it('analyzes a duplicate-heavy feed without quadratic slowdown', () => {
    const duplicateCount = 12_000;
    const rows = Array.from({ length: duplicateCount }, (_, index) => ({
      rowNumber: index + 2,
      sku: 'DUPLICATE-SKU',
      quantity: 1,
      rawSku: 'DUPLICATE-SKU',
      rawQuantity: 1,
    }));

    const startedAt = performance.now();
    const issues = analyzeSingleFile(rows);
    const elapsedMs = performance.now() - startedAt;

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_SKU',
        affectedCount: duplicateCount,
      }),
    );
    expect(elapsedMs).toBeLessThan(750);
  });
});
