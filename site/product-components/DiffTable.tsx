'use client';

import { useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import type { InventoryIssue } from '@/features/inventory/types';

type DiffRow = {
  sku: string;
  previousQuantity?: number;
  currentQuantity?: number;
};

const PAGE_SIZE = 100;

export function DiffTable({ issues }: { issues: InventoryIssue[] }) {
  const [page, setPage] = useState(0);
  const bySku = new Map<string, DiffRow>();
  for (const issue of issues) {
    if (!issue.sku) continue;
    const existing = bySku.get(issue.sku) ?? { sku: issue.sku };
    bySku.set(issue.sku, {
      sku: issue.sku,
      previousQuantity: issue.previousQuantity ?? existing.previousQuantity,
      currentQuantity: issue.currentQuantity ?? existing.currentQuantity,
    });
  }
  const rows = [...bySku.values()].filter(
    (row) =>
      row.previousQuantity !== undefined || row.currentQuantity !== undefined,
  );
  if (rows.length === 0) return null;
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold">SKU quantity diff</h2>
        <p className="mt-1 text-sm text-muted-foreground">Before and after values for affected SKUs.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold sm:px-6">SKU</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Previous</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold sm:pr-6">Current</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.sku} className="border-t border-border">
                <td className="px-5 py-3 font-mono text-xs font-semibold sm:px-6">{row.sku}</td>
                <td className="px-5 py-3 text-right font-mono text-xs tabular-nums">{row.previousQuantity ?? '—'}</td>
                <td className="px-5 py-3 text-right font-mono text-xs tabular-nums sm:pr-6">{row.currentQuantity ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageCount > 1 ? (
          <Pagination
            aria-label="Quantity diff pages"
            className="flex items-center justify-end gap-3 border-t border-border px-5 py-4"
          >
            <PaginationContent className="gap-3">
              <PaginationItem>
                <button
                  type="button"
                  aria-label="Previous diff page"
                  disabled={safePage === 0}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage(safePage - 1)}
                >
                  Previous
                </button>
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm text-muted-foreground">
                  Page {safePage + 1} of {pageCount}
                </span>
              </PaginationItem>
              <PaginationItem>
                <button
                  type="button"
                  aria-label="Next diff page"
                  disabled={safePage === pageCount - 1}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </section>
  );
}
