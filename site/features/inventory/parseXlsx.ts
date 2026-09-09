import { readSheet } from 'read-excel-file/universal';

import {
  assertSupportedFile,
  readFileAsArrayBuffer,
  tableFromGrid,
} from './parseFile';
import type { RawTable } from './types';

export async function parseXlsx(file: File): Promise<RawTable> {
  assertSupportedFile(file, 'supplier');
  const buffer = await readFileAsArrayBuffer(file);
  const grid = await readSheet(buffer);

  return tableFromGrid(grid);
}
