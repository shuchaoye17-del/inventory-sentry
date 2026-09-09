import 'fake-indexeddb/auto';

import { clear } from 'idb-keyval';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { listScanSummaries } from '@/features/inventory/history';
import type { ScanResult } from '@/features/inventory/types';

import { ScanActions } from './ScanActions';

const result: ScanResult = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-09-09T00:00:00.000Z',
  currentFileName: 'current.csv',
  level: 'green',
  issues: [],
  counts: { currentRows: 1, matchedRows: 0, redIssues: 0, yellowIssues: 0 },
};

describe('ScanActions', () => {
  beforeEach(async () => clear());

  it('saves a rejected decision and reflects the selected state', async () => {
    const user = userEvent.setup();
    render(<ScanActions result={result} />);

    await user.click(screen.getByRole('button', { name: 'Reject scan' }));

    expect(await screen.findByText('Decision saved: rejected')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await listScanSummaries())[0]?.decision).toBe('rejected');
    });
  });

  it('clears a saved decision when a recalculation produces a new result', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ScanActions result={result} />);

    await user.click(screen.getByRole('button', { name: 'Approve scan' }));
    expect(
      await screen.findByText('Decision saved: approved'),
    ).toBeInTheDocument();

    rerender(
      <ScanActions
        result={{
          ...result,
          id: '22222222-2222-4222-8222-222222222222',
          level: 'red',
        }}
      />,
    );

    expect(screen.queryByText(/Decision saved:/)).not.toBeInTheDocument();
  });
});
