import 'fake-indexeddb/auto';

import { clear } from 'idb-keyval';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveScanSummary } from '@/features/inventory/history';
import type { ScanResult } from '@/features/inventory/types';

import { HistoryPage } from './HistoryPage';

const result: ScanResult = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-09-09T00:00:00.000Z',
  currentFileName: 'current.csv',
  level: 'red',
  issues: [{ code: 'MASS_ZEROING', level: 'red', affectedCount: 25, message: '25 SKUs were zeroed.' }],
  counts: { currentRows: 25, matchedRows: 25, redIssues: 1, yellowIssues: 0 },
};

describe('HistoryPage', () => {
  beforeEach(async () => clear());

  it('guides the user when there are no saved decisions', async () => {
    render(<HistoryPage onBack={vi.fn()} />);

    expect(await screen.findByText(/no saved scan decisions yet/i)).toBeInTheDocument();
  });

  it('lists the filename, risk, and saved decision', async () => {
    await saveScanSummary(result, 'rejected');
    render(<HistoryPage onBack={vi.fn()} />);

    expect(await screen.findByText('current.csv')).toBeInTheDocument();
    expect(screen.getByText('RED')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});
