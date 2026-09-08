'use client';

import { SlidersHorizontal } from 'lucide-react';

import type { AnalysisThresholds } from '@/features/inventory/types';

type ThresholdPanelProps = {
  thresholds: AnalysisThresholds;
  onChange: (thresholds: AnalysisThresholds) => void;
};

type NumberFieldProps = {
  label: string;
  defaultValue: number;
  min: number;
  max?: number;
  step?: number;
  suffix?: string;
  onCommit: (value: number) => void;
};

function NumberField({
  label,
  defaultValue,
  min,
  max,
  step = 1,
  suffix,
  onCommit,
}: NumberFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <span className="flex items-center rounded-lg border border-input bg-card focus-within:border-ring">
        <input
          aria-label={label}
          type="number"
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none"
          onBlur={(event) => {
            const parsed = Number(event.currentTarget.value);
            if (Number.isFinite(parsed)) onCommit(parsed);
          }}
        />
        {suffix ? (
          <span className="border-l border-border px-3 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function ThresholdPanel({ thresholds, onChange }: ThresholdPanelProps) {
  return (
    <details className="rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold sm:px-6">
        <SlidersHorizontal aria-hidden="true" className="size-4 text-link" />
        Advanced thresholds
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          Changes rerun the scan locally
        </span>
      </summary>
      <div className="grid gap-5 border-t border-border px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <NumberField
          label="Large change percent"
          defaultValue={thresholds.largeChangePercent * 100}
          min={0}
          max={100}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, largeChangePercent: value / 100 })
          }
        />
        <NumberField
          label="Large change units"
          defaultValue={thresholds.largeChangeAbsolute}
          min={0}
          onCommit={(value) =>
            onChange({ ...thresholds, largeChangeAbsolute: value })
          }
        />
        <NumberField
          label="Mass zero count"
          defaultValue={thresholds.massZeroCount}
          min={1}
          onCommit={(value) =>
            onChange({ ...thresholds, massZeroCount: value })
          }
        />
        <NumberField
          label="Mass zero percent"
          defaultValue={thresholds.massZeroPercent * 100}
          min={0}
          max={100}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massZeroPercent: value / 100 })
          }
        />
        <NumberField
          label="Mass missing count"
          defaultValue={thresholds.massMissingCount}
          min={1}
          onCommit={(value) =>
            onChange({ ...thresholds, massMissingCount: value })
          }
        />
        <NumberField
          label="Mass missing percent"
          defaultValue={thresholds.massMissingPercent * 100}
          min={0}
          max={100}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massMissingPercent: value / 100 })
          }
        />
        <NumberField
          label="Mass new count"
          defaultValue={thresholds.massNewCount}
          min={1}
          onCommit={(value) =>
            onChange({ ...thresholds, massNewCount: value })
          }
        />
        <NumberField
          label="Mass new percent"
          defaultValue={thresholds.massNewPercent * 100}
          min={0}
          max={100}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massNewPercent: value / 100 })
          }
        />
      </div>
    </details>
  );
}
