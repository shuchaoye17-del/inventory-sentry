import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { InventorySafetyApp } from './InventorySafetyApp';

describe('inventory safety workflow', () => {
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
});
