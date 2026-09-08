import { read, utils } from 'xlsx';

import {
  assertSupportedFile,
  readFileAsArrayBuffer,
  tableFromGrid,
} from './parseFile';
import type { RawTable } from './types';

export async function parseXlsx(file: File): Promise<RawTable> {
  assertSupportedFile(file, 'supplier');
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('The workbook has no worksheets.');

  const sheet = workbook.Sheets[firstSheetName];
  const grid = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });

  return tableFromGrid(grid);
}
