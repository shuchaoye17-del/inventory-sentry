import { CheckCircle2 } from 'lucide-react';

import type { RawTable } from '@/features/inventory/types';

type FilePreviewProps = {
  fileName: string;
  table: RawTable;
};

const displayCell = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
};

export function FilePreview({ fileName, table }: FilePreviewProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {table.rows.length} data rows
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Read locally
        </span>
      </div>
      <div className="overflow-x-auto" data-testid="file-preview-table">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              {table.headers.map((header) => (
                <th key={header} scope="col" className="border-b border-border px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, 5).map((row, index) => (
              <tr key={index} className="border-b border-border/70 last:border-0">
                {table.headers.map((header) => (
                  <td key={header} className="px-4 py-3 font-mono text-xs">
                    {displayCell(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
