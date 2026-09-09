import { z } from 'zod';

import type { RawTable } from './types';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

const rawTableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
});

export type FileKind = 'supplier' | 'shopify';

export function assertSupportedFile(file: File, kind: FileKind): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Choose a file that is 20 MB or smaller.');
  }

  const name = file.name.toLocaleLowerCase();
  const allowed = kind === 'shopify' ? ['.csv'] : ['.csv', '.xlsx'];
  if (!allowed.some((extension) => name.endsWith(extension))) {
    throw new Error(
      kind === 'shopify'
        ? 'Shopify exports must be CSV files.'
        : 'Supplier files must be CSV or XLSX files.',
    );
  }
}

export function validateRawTable(input: RawTable): RawTable {
  const table = rawTableSchema.parse(input);
  if (table.headers.length === 0) {
    throw new Error('The file is empty.');
  }

  const headers = table.headers.map((header) => header.trim());
  if (headers.some((header) => header.length === 0)) {
    throw new Error('The file contains an invalid empty header.');
  }

  const normalized = headers.map((header) => header.toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('The file contains a duplicate header.');
  }

  if (table.rows.length === 0) {
    throw new Error('The file has no data rows.');
  }

  return { headers, rows: table.rows };
}

export function tableFromGrid(grid: unknown[][]): RawTable {
  if (grid.length === 0) return validateRawTable({ headers: [], rows: [] });

  const cellText = (cell: unknown) =>
    typeof cell === 'string' || typeof cell === 'number'
      ? String(cell).trim()
      : '';
  const isBlankCell = (cell: unknown) =>
    cell === null ||
    cell === undefined ||
    (typeof cell === 'string' && cell.trim() === '');
  const headers = grid[0].map(cellText);
  const dataRows = grid.slice(1).filter((row) =>
    row.some((cell) => !isBlankCell(cell)),
  );
  const rows = dataRows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? '']),
    ),
  );

  return validateRawTable({ headers, rows });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The file could not be read.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('The file could not be read.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function parseSupplierFile(file: File): Promise<RawTable> {
  assertSupportedFile(file, 'supplier');
  if (file.name.toLocaleLowerCase().endsWith('.xlsx')) {
    const { parseXlsx } = await import('./parseXlsx');
    return parseXlsx(file);
  }
  const { parseCsv } = await import('./parseCsv');
  return parseCsv(file);
}
