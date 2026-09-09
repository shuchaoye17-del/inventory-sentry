'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';

import type { AnalysisThresholds } from '@/features/inventory/types';

type ThresholdPanelProps = {
  thresholds: AnalysisThresholds;
  onChange: (thresholds: AnalysisThresholds) => void;
};

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  suffix?: string;
  integerOnly?: boolean;
  onCommit: (value: number) => void;
};

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  integerOnly = false,
  onCommit,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const errorId = useId();

  const reject = (message: string) => {
    setError(message);
    setDraft(String(value));
  };

  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <span className="flex items-center rounded-lg border border-input bg-card focus-within:border-ring">
        <input
          aria-label={label}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none"
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setError('');
          }}
          onBlur={() => {
            if (draft.trim() === '') {
              reject(`${label} is required.`);
              return;
            }

            const parsed = Number(draft);
            if (!Number.isFinite(parsed)) {
              reject(`${label} must be a number.`);
              return;
            }
            if (parsed < min || (max !== undefined && parsed > max)) {
              reject(
                max === undefined
                  ? `${label} must be at least ${min}.`
                  : `${label} must be between ${min} and ${max}.`,
              );
              return;
            }
            if (integerOnly && !Number.isInteger(parsed)) {
              reject(`${label} must be a whole number.`);
              return;
            }

            setError('');
            setDraft(String(parsed));
            onCommit(parsed);
          }}
        />
        {suffix ? (
          <span className="border-l border-border px-3 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </span>
      {error ? (
        <span id={errorId} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </span>
      ) : null}
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
          value={thresholds.largeChangePercent * 100}
          min={0}
          max={100}
          step={0.1}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, largeChangePercent: value / 100 })
          }
        />
        <NumberField
          label="Large change units"
          value={thresholds.largeChangeAbsolute}
          min={0}
          integerOnly
          onCommit={(value) =>
            onChange({ ...thresholds, largeChangeAbsolute: value })
          }
        />
        <NumberField
          label="Mass zero count"
          value={thresholds.massZeroCount}
          min={1}
          integerOnly
          onCommit={(value) =>
            onChange({ ...thresholds, massZeroCount: value })
          }
        />
        <NumberField
          label="Mass zero percent"
          value={thresholds.massZeroPercent * 100}
          min={0}
          max={100}
          step={0.1}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massZeroPercent: value / 100 })
          }
        />
        <NumberField
          label="Mass missing count"
          value={thresholds.massMissingCount}
          min={1}
          integerOnly
          onCommit={(value) =>
            onChange({ ...thresholds, massMissingCount: value })
          }
        />
        <NumberField
          label="Mass missing percent"
          value={thresholds.massMissingPercent * 100}
          min={0}
          max={100}
          step={0.1}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massMissingPercent: value / 100 })
          }
        />
        <NumberField
          label="Mass new count"
          value={thresholds.massNewCount}
          min={1}
          integerOnly
          onCommit={(value) =>
            onChange({ ...thresholds, massNewCount: value })
          }
        />
        <NumberField
          label="Mass new percent"
          value={thresholds.massNewPercent * 100}
          min={0}
          max={100}
          step={0.1}
          suffix="%"
          onCommit={(value) =>
            onChange({ ...thresholds, massNewPercent: value / 100 })
          }
        />
      </div>
    </details>
  );
}
