import { describe, expect, it } from 'vitest';

import { TWO_SHEET_WORKBOOK_BASE64 } from '@/tests/fixtures/two-sheet-workbook';

import { parseCsv } from './parseCsv';
import {
  assertSupportedFile,
  MAX_FILE_BYTES,
  parseSupplierFile,
  validateRawTable,
} from './parseFile';
import { parseXlsx } from './parseXlsx';

describe('local inventory file parsing', () => {
  it('preserves raw CSV cell values behind validated headers', async () => {
    const file = new File(['SKU,Qty\nA-1,0012\n'], 'current.csv', {
      type: 'text/csv',
    });

    await expect(parseCsv(file)).resolves.toEqual({
      headers: ['SKU', 'Qty'],
      rows: [{ SKU: 'A-1', Qty: '0012' }],
    });
  });

  it('rejects duplicate headers before a parser can rename them', async () => {
    const file = new File(['SKU, sku \nA-1,12\n'], 'duplicate.csv');

    await expect(parseCsv(file)).rejects.toThrow(/duplicate header/i);
  });

  it('rejects a table with headers but no inventory rows', () => {
    expect(() =>
      validateRawTable({ headers: ['SKU', 'Qty'], rows: [] }),
    ).toThrow(/no data rows/i);
  });

  it('rejects files over 20 MB before reading them', () => {
    const oversized = new File(
      [new Uint8Array(MAX_FILE_BYTES + 1)],
      'large.csv',
    );

    expect(() => assertSupportedFile(oversized, 'supplier')).toThrow(/20 MB/i);
  });

  it('accepts only CSV Shopify exports', () => {
    const file = new File(['SKU\nA-1\n'], 'shopify.xlsx');

    expect(() => assertSupportedFile(file, 'shopify')).toThrow(/CSV/i);
  });

  it('reads only the first XLSX worksheet and keeps numeric cells numeric', async () => {
    const bytes = Uint8Array.from(
      atob(TWO_SHEET_WORKBOOK_BASE64),
      (character) => character.charCodeAt(0),
    );
    const file = new File([bytes], 'current.xlsx');

    await expect(parseXlsx(file)).resolves.toEqual({
      headers: ['SKU', 'Qty'],
      rows: [{ SKU: 'A-1', Qty: 12 }],
    });
  });

  it('routes supplier files by their extension', async () => {
    const file = new File(['SKU,Qty\nA-1,12\n'], 'current.csv');

    await expect(parseSupplierFile(file)).resolves.toEqual({
      headers: ['SKU', 'Qty'],
      rows: [{ SKU: 'A-1', Qty: '12' }],
    });
  });
});
