import { describe, expect, it } from 'vitest';

import { exportIssuesCsv, exportScanJson } from './report';
import type { ScanResult } from './types';

const result: ScanResult = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-09-09T00:00:00.000Z',
  currentFileName: 'current.csv',
  level: 'yellow',
  issues: [
    {
      code: 'NEW_SKU',
      level: 'yellow',
      sku: 'A,1',
      currentQuantity: 12,
      message: 'Review "A,1"',
    },
    {
      code: 'UNKNOWN_SHOPIFY_SKU',
      level: 'yellow',
      sku: '=2+2',
      message: 'Formula-like SKU',
    },
  ],
  counts: { currentRows: 2, matchedRows: 0, redIssues: 0, yellowIssues: 2 },
};

describe('scan report exports', () => {
  it('exports the complete scan result as formatted JSON', async () => {
    const blob = exportScanJson(result);

    expect(blob.type).toBe('application/json;charset=utf-8');
    await expect(blob.text().then(JSON.parse)).resolves.toEqual(result);
  });

  it('escapes CSV punctuation and neutralizes formula-like text', async () => {
    const csv = await exportIssuesCsv(result).text();

    expect(csv).toContain('"A,1"');
    expect(csv).toContain('"Review ""A,1"""');
    expect(csv).toContain('"\'=2+2"');
  });

  it('neutralizes every dangerous spreadsheet formula prefix', async () => {
    const dangerousSkus = [
      '=2+2',
      '+2+2',
      '-2+2',
      '@SUM(A1:A2)',
      '\t=2+2',
      '\r=2+2',
      '\n=2+2',
    ];
    const csv = await exportIssuesCsv({
      ...result,
      issues: dangerousSkus.map((sku) => ({
        code: 'UNKNOWN_SHOPIFY_SKU' as const,
        level: 'yellow' as const,
        sku,
        message: 'Formula-like SKU',
      })),
    }).text();

    for (const sku of dangerousSkus) {
      expect(csv).toContain(`"'${sku}"`);
    }
  });
});
