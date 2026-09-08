import { ArrowLeft, FileCheck2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ISSUE_RISK_REASON,
  ISSUE_TITLES,
} from '@/features/inventory/explanations';
import type {
  AnalysisThresholds,
  InventoryIssue,
  ScanResult,
} from '@/features/inventory/types';

import { DiffTable } from './DiffTable';
import { IssueTable } from './IssueTable';
import { RiskBanner } from './RiskBanner';
import { ThresholdPanel } from './ThresholdPanel';

type ResultsDashboardProps = {
  result: ScanResult;
  thresholds: AnalysisThresholds;
  onThresholdsChange: (thresholds: AnalysisThresholds) => void;
  onBack: () => void;
};

const affectedCount = (issues: InventoryIssue[]) => {
  const aggregate = issues
    .filter((issue) => issue.affectedCount !== undefined)
    .reduce((largest, issue) => Math.max(largest, issue.affectedCount ?? 0), 0);
  if (aggregate > 0) return aggregate;
  return new Set(issues.map((issue) => issue.sku).filter(Boolean)).size;
};

export function ResultsDashboard({
  result,
  thresholds,
  onThresholdsChange,
  onBack,
}: ResultsDashboardProps) {
  const uniqueCodes = [...new Set(result.issues.map((issue) => issue.code))];
  const affected = affectedCount(result.issues);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Back to inputs
      </Button>
      <div className="mt-6">
        <RiskBanner level={result.level} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Current rows', result.counts.currentRows],
          ['Matched rows', result.counts.matchedRows],
          ['Red issues', result.counts.redIssues],
          ['Yellow issues', result.counts.yellowIssues],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {result.issues.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Why this was flagged</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fixed rule explanations — no AI interpretation.
              </p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
              {affected} affected SKUs
            </span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {uniqueCodes.map((code) => (
              <div key={code} className="flex gap-3 rounded-xl bg-surface-muted p-4">
                <FileCheck2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-link" />
                <div>
                  <p className="text-sm font-semibold">{ISSUE_TITLES[code]}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {ISSUE_RISK_REASON[code]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 space-y-6">
        <IssueTable issues={result.issues} />
        <DiffTable issues={result.issues} />
        <ThresholdPanel thresholds={thresholds} onChange={onThresholdsChange} />
      </div>
    </section>
  );
}
