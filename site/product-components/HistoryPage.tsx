'use client';

import { ArrowLeft, Clock3, FileClock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { listScanSummaries } from '@/features/inventory/history';
import type { StoredScanSummary } from '@/features/inventory/types';

const riskClass = {
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-900',
  green: 'bg-emerald-100 text-emerald-800',
};

const decisionLabel = {
  approved: 'Approved',
  rejected: 'Rejected',
  undecided: 'Undecided',
};

export function HistoryPage({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<StoredScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void listScanSummaries()
      .then((summaries) => {
        if (active) setItems(summaries);
      })
      .catch(() => {
        if (active) setError('Local scan history could not be opened.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Back to scan
      </Button>
      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-link">Local record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Scan history</h1>
        <p className="mt-3 text-muted-foreground">
          Compact summaries and decisions stored only in this browser.
        </p>
      </div>

      {loading ? (
        <output className="mt-10 block text-sm text-muted-foreground">Loading local history…</output>
      ) : null}
      {error ? <p className="mt-10 text-sm font-medium text-destructive" role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-card px-6 py-14 text-center">
          <FileClock aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No saved scan decisions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Approve or reject a completed scan to create a local record.</p>
        </div>
      ) : null}
      {items.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold sm:px-6">File</th>
                <th scope="col" className="px-5 py-3 font-semibold">Scanned</th>
                <th scope="col" className="px-5 py-3 font-semibold">Risk</th>
                <th scope="col" className="px-5 py-3 font-semibold">Issues</th>
                <th scope="col" className="px-5 py-3 font-semibold sm:pr-6">Decision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold sm:px-6">{item.currentFileName}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4" />{new Date(item.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskClass[item.level]}`}>{item.level.toUpperCase()}</span></td>
                  <td className="px-5 py-4 font-mono text-xs tabular-nums">{item.issues.length}</td>
                  <td className="px-5 py-4 font-semibold sm:pr-6">{decisionLabel[item.decision]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
