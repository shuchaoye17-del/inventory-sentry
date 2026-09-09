import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ColumnMapper,
  type ColumnMapping,
  isValidMapping,
} from './ColumnMapper';

function MappingHarness() {
  const [value, setValue] = useState<ColumnMapping>({
    skuColumn: '',
    quantityColumn: '',
  });
  return (
    <ColumnMapper
      headers={['SKU', 'Qty']}
      labelPrefix="Current"
      value={value}
      onChange={setValue}
    />
  );
}

describe('ColumnMapper', () => {
  it('explains why the same SKU and quantity selection is unsafe', async () => {
    const user = userEvent.setup();
    render(<MappingHarness />);

    await user.selectOptions(screen.getByLabelText('Current SKU column'), 'SKU');
    await user.selectOptions(
      screen.getByLabelText('Current quantity column'),
      'SKU',
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/must be different/i);
  });

  it('accepts two distinct headers and rejects missing headers', () => {
    expect(
      isValidMapping(['SKU', 'Qty'], {
        skuColumn: 'SKU',
        quantityColumn: 'Qty',
      }),
    ).toBe(true);
    expect(
      isValidMapping(['SKU', 'Qty'], {
        skuColumn: 'Missing',
        quantityColumn: 'Qty',
      }),
    ).toBe(false);
  });
});
