'use client';

import { Check, Download, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { saveScanSummary } from '@/features/inventory/history';
import { exportIssuesCsv, exportScanJson } from '@/features/inventory/report';
import type { ScanDecision, ScanResult } from '@/features/inventory/types';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function ScanActions({ result }: { result: ScanResult }) {
  const [decision, setDecision] = useState<ScanDecision>('undecided');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const decide = async (nextDecision: ScanDecision) => {
    setSaving(true);
    setError('');
    try {
      await saveScanSummary(result, nextDecision);
      setDecision(nextDecision);
    } catch {
      setError('The decision could not be saved to local history.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <h2 className="text-lg font-semibold">Record the decision</h2>
          <p className="mt-1 text-sm text-white/62">
            The summary and issue list stay in this browser. Raw rows are not saved.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void decide('approved')}
          >
            <Check aria-hidden="true" /> Approve scan
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-500"
            disabled={saving}
            onClick={() => void decide('rejected')}
          >
            <X aria-hidden="true" /> Reject scan
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/12 pt-5">
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={() =>
            downloadBlob(exportScanJson(result), `${result.id}-scan.json`)
          }
        >
          <Download aria-hidden="true" /> Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={() =>
            downloadBlob(exportIssuesCsv(result), `${result.id}-issues.csv`)
          }
        >
          <Download aria-hidden="true" /> Export issue CSV
        </Button>
        {decision !== 'undecided' ? (
          <output className="ml-auto text-sm font-semibold">
            Decision saved: {decision}
          </output>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
