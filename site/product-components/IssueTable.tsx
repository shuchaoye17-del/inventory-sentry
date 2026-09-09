'use client';

import { useMemo, useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { ISSUE_TITLES } from '@/features/inventory/explanations';
import type { InventoryIssue, IssueCode } from '@/features/inventory/types';

type SeverityFilter = 'all' | 'red' | 'yellow';

const PAGE_SIZE = 100;

const quantity = (value: number | undefined) => value ?? '—';

export function IssueTable({ issues }: { issues: InventoryIssue[] }) {
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [code, setCode] = useState<'all' | IssueCode>('all');
  const [page, setPage] = useState(0);
  const codes = useMemo(
    () => [...new Set(issues.map((issue) => issue.code))],
    [issues],
  );
  const visible = issues.filter(
    (issue) =>
      (severity === 'all' || issue.level === severity) &&
      (code === 'all' || issue.code === code),
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageIssues = visible.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold">Triggered checks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {visible.length} of {issues.length} issues shown
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Severity
            <select
              aria-label="Severity filter"
              className="h-9 min-w-32 rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground"
              value={severity}
              onChange={(event) => {
                setSeverity(event.currentTarget.value as SeverityFilter);
                setPage(0);
              }}
            >
              <option value="all">All severities</option>
              <option value="red">Red only</option>
              <option value="yellow">Yellow only</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Check
            <select
              aria-label="Check filter"
              className="h-9 min-w-44 rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground"
              value={code}
              onChange={(event) => {
                setCode(event.currentTarget.value as 'all' | IssueCode);
                setPage(0);
              }}
            >
              <option value="all">All checks</option>
              {codes.map((issueCode) => (
                <option key={issueCode} value={issueCode}>
                  {ISSUE_TITLES[issueCode]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Severity</th>
              <th scope="col" className="px-4 py-3 font-semibold">Check</th>
              <th scope="col" className="px-4 py-3 font-semibold">SKU</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Previous</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Current</th>
              <th scope="col" className="px-4 py-3 font-semibold sm:pr-6">Details</th>
            </tr>
          </thead>
          <tbody>
            {pageIssues.map((issue, index) => (
              <tr key={`${issue.code}-${issue.sku ?? issue.rowNumber ?? index}`} className="border-t border-border align-top">
                <td className="px-4 py-4 sm:px-6">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${issue.level === 'red' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
                    {issue.level}
                  </span>
                </td>
                <td className="px-4 py-4"><span className="font-mono text-xs font-semibold">{issue.code}</span></td>
                <td className="px-4 py-4 font-mono text-xs">{issue.sku ?? '—'}</td>
                <td className="px-4 py-4 text-right font-mono text-xs tabular-nums">{quantity(issue.previousQuantity)}</td>
                <td className="px-4 py-4 text-right font-mono text-xs tabular-nums">{quantity(issue.currentQuantity)}</td>
                <td className="max-w-md px-4 py-4 text-muted-foreground sm:pr-6">{issue.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? <p className="px-6 py-10 text-center text-sm text-muted-foreground">No issues match these filters.</p> : null}
        {pageCount > 1 ? (
          <Pagination
            aria-label="Issue table pages"
            className="flex items-center justify-end gap-3 border-t border-border px-5 py-4"
          >
            <PaginationContent className="gap-3">
              <PaginationItem>
                <button
                  type="button"
                  aria-label="Previous issue page"
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
                  aria-label="Next issue page"
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
