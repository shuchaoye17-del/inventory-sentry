import type { ScanResult } from './types';

export function exportScanJson(result: ScanResult): Blob {
  return new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
}

const csvCell = (value: unknown) => {
  let text =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  if (typeof value === 'string' && /^[=+@\-\t\r\n]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
};

export function exportIssuesCsv(result: ScanResult): Blob {
  const header = [
    'code',
    'severity',
    'sku',
    'rowNumber',
    'affectedCount',
    'previousQuantity',
    'currentQuantity',
    'message',
  ];
  const rows = result.issues.map((issue) => [
    issue.code,
    issue.level,
    issue.sku,
    issue.rowNumber,
    issue.affectedCount,
    issue.previousQuantity,
    issue.currentQuantity,
    issue.message,
  ]);
  return new Blob(
    [[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')],
    { type: 'text/csv;charset=utf-8' },
  );
}
