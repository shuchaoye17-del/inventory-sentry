import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InventorySafetyApp } from './InventorySafetyApp';

describe('inventory safety workflow', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('previews a local current file and enables analysis only after valid mapping', async () => {
    const user = userEvent.setup();
    render(<InventorySafetyApp />);
    const file = new File(['SKU,Quantity\nA-1,12\nB-2,4\n'], 'current.csv', {
      type: 'text/csv',
    });

    await user.upload(screen.getByLabelText('Current supplier file'), file);

    expect(await screen.findByText('current.csv')).toBeInTheDocument();
    expect(screen.getByText('2 data rows')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'A-1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue to mapping/i }));

    const runButton = screen.getByRole('button', { name: /run safety check/i });
    expect(runButton).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Current SKU column'), 'SKU');
    await user.selectOptions(
      screen.getByLabelText('Current quantity column'),
      'Quantity',
    );
    expect(runButton).toBeEnabled();
  });

  it('loads the bundled sample through the visible local action', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('SKU,Quantity\nSAMPLE-001,8\nSAMPLE-002,3\n', {
          status: 200,
        }),
      ),
    );
    render(<InventorySafetyApp />);

    const sampleButton = screen.getByRole('button', {
      name: /try sample inventory instead/i,
    });
    expect(sampleButton).toBeEnabled();
    await user.click(sampleButton);

    expect(await screen.findByText('clean-current.csv')).toBeInTheDocument();
    expect(screen.getByTestId('file-preview-table')).toHaveClass('overflow-x-auto');
  });

  it('keeps the workflow recoverable when the bundled sample is unavailable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    );
    render(<InventorySafetyApp />);

    await user.click(
      screen.getByRole('button', { name: /try sample inventory instead/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /sample file is unavailable/i,
    );
    expect(
      screen.getByRole('button', { name: /upload current supplier file/i }),
    ).toBeEnabled();
  });
});
