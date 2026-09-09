import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_THRESHOLDS } from '@/features/inventory/risk';
import type { ScanResult } from '@/features/inventory/types';

import { ResultsDashboard } from './ResultsDashboard';

const redResult: ScanResult = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-09-09T00:00:00.000Z',
  currentFileName: 'mass-zero-current.csv',
  previousFileName: 'previous-good.csv',
  level: 'red',
  issues: [
    {
      code: 'MASS_ZEROING',
      level: 'red',
      affectedCount: 25,
      message: '25 SKUs were zeroed at once.',
    },
    {
      code: 'ZEROED_SKU',
      level: 'yellow',
      sku: 'SKU-001',
      previousQuantity: 100,
      currentQuantity: 0,
      message: 'SKU-001 changed from 100 to zero.',
    },
  ],
  counts: {
    currentRows: 25,
    matchedRows: 25,
    redIssues: 1,
    yellowIssues: 1,
  },
};

describe('ResultsDashboard', () => {
  it('shows the decision, affected count, fixed reason, and SKU quantities', () => {
    render(
      <ResultsDashboard
        result={redResult}
        thresholds={DEFAULT_THRESHOLDS}
        onThresholdsChange={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'RED — Update blocked' }),
    ).toBeInTheDocument();
    expect(screen.getByText('25 affected SKUs')).toBeInTheDocument();
    expect(
      screen.getByText(/many items becoming unavailable at once is likely systemic/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '100' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: '0' }).length).toBeGreaterThan(0);
  });

  it('filters issues by severity', async () => {
    const user = userEvent.setup();
    render(
      <ResultsDashboard
        result={redResult}
        thresholds={DEFAULT_THRESHOLDS}
        onThresholdsChange={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Severity filter'), 'yellow');

    expect(screen.queryByText('MASS_ZEROING')).not.toBeInTheDocument();
    expect(screen.getByText('ZEROED_SKU')).toBeInTheDocument();
  });

  it('converts edited percentage thresholds back to fractions', async () => {
    const user = userEvent.setup();
    const onThresholdsChange = vi.fn();
    render(
      <ResultsDashboard
        result={redResult}
        thresholds={DEFAULT_THRESHOLDS}
        onThresholdsChange={onThresholdsChange}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Advanced thresholds'));
    const input = screen.getByLabelText('Large change percent');
    await user.clear(input);
    await user.type(input, '90');
    await user.tab();

    expect(onThresholdsChange).toHaveBeenLastCalledWith({
      ...DEFAULT_THRESHOLDS,
      largeChangePercent: 0.9,
    });
  });

  it('rejects an empty threshold and keeps the previous value', async () => {
    const user = userEvent.setup();
    const onThresholdsChange = vi.fn();
    render(
      <ResultsDashboard
        result={redResult}
        thresholds={DEFAULT_THRESHOLDS}
        onThresholdsChange={onThresholdsChange}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Advanced thresholds'));
    const input = screen.getByLabelText('Large change percent');
    await user.clear(input);
    await user.tab();

    expect(onThresholdsChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(80);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Large change percent is required.',
    );
  });

  it.each([
    ['Large change percent', '101', 'must be between 0 and 100'],
    ['Large change units', '-1', 'must be at least 0'],
    ['Large change units', '1.5', 'must be a whole number'],
    ['Mass zero count', '1.5', 'must be a whole number'],
  ])(
    'rejects an invalid %s value',
    async (label, invalidValue, expectedMessage) => {
      const user = userEvent.setup();
      const onThresholdsChange = vi.fn();
      render(
        <ResultsDashboard
          result={redResult}
          thresholds={DEFAULT_THRESHOLDS}
          onThresholdsChange={onThresholdsChange}
          onBack={vi.fn()}
        />,
      );

      await user.click(screen.getByText('Advanced thresholds'));
      const input = screen.getByLabelText(label);
      await user.clear(input);
      await user.type(input, invalidValue);
      await user.tab();

      expect(onThresholdsChange).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(expectedMessage);
    },
  );
});
