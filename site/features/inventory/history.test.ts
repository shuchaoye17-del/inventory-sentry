import 'fake-indexeddb/auto';

import { clear } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';

import { listScanSummaries, saveScanSummary } from './history';
import type { ScanResult } from './types';

const scan = (id: string, createdAt: string): ScanResult => ({
  id,
  createdAt,
  currentFileName: `${id}.csv`,
  level: 'green',
  issues: [],
  counts: { currentRows: 1, matchedRows: 0, redIssues: 0, yellowIssues: 0 },
});

describe('local scan history', () => {
  beforeEach(async () => clear());

  it('stores only the explicit summary fields and decision', async () => {
    const unsafeInput = {
      ...scan('one', '2026-09-09T00:00:00.000Z'),
      rows: [{ SKU: 'SECRET', Quantity: 10 }],
      rawFile: 'supplier contents',
    };

    await saveScanSummary(unsafeInput, 'rejected');
    const [saved] = await listScanSummaries();

    expect(saved.decision).toBe('rejected');
    expect(saved).not.toHaveProperty('rows');
    expect(saved).not.toHaveProperty('rawFile');
  });

  it('returns summaries newest first and replaces an existing decision', async () => {
    await saveScanSummary(scan('older', '2026-09-08T00:00:00.000Z'), 'undecided');
    await saveScanSummary(scan('newer', '2026-09-09T00:00:00.000Z'), 'approved');
    await saveScanSummary(scan('older', '2026-09-08T00:00:00.000Z'), 'rejected');

    const saved = await listScanSummaries();

    expect(saved.map((item) => item.id)).toEqual(['newer', 'older']);
    expect(saved[1].decision).toBe('rejected');
  });
});
