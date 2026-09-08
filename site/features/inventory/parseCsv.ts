import Papa from 'papaparse';

import {
  assertSupportedFile,
  readFileAsText,
  tableFromGrid,
} from './parseFile';
import type { RawTable } from './types';

export async function parseCsv(file: File): Promise<RawTable> {
  assertSupportedFile(file, 'supplier');
  const content = await readFileAsText(file);
  const parsed = Papa.parse<string[]>(content, {
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length > 0) {
    throw new Error(`The CSV could not be parsed: ${parsed.errors[0].message}`);
  }

  return tableFromGrid(parsed.data);
}
