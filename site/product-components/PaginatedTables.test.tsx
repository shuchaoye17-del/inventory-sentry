import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { InventoryIssue } from '@/features/inventory/types';

import { DiffTable } from './DiffTable';
import { IssueTable } from './IssueTable';

const issues: InventoryIssue[] = Array.from({ length: 101 }, (_, index) => {
  const sku = `SKU-${String(index + 1).padStart(3, '0')}`;
  return {
    code: 'NEW_SKU',
    level: 'yellow',
    sku,
    previousQuantity: index,
    currentQuantity: index + 1,
    message: `${sku} is new.`,
  };
});

describe('large result tables', () => {
  it('paginates issue rows without removing issues from the result', async () => {
    const user = userEvent.setup();
    const { container } = render(<IssueTable issues={issues} />);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(100);
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.queryByText('SKU-101')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next issue page' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(screen.queryByText('SKU-001')).not.toBeInTheDocument();
    expect(screen.getByText('SKU-101')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('paginates quantity diff rows', async () => {
    const user = userEvent.setup();
    const { container } = render(<DiffTable issues={issues} />);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(100);
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.queryByText('SKU-101')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next diff page' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(screen.queryByText('SKU-001')).not.toBeInTheDocument();
    expect(screen.getByText('SKU-101')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });
});
