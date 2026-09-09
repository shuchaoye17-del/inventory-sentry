import { CheckCircle2, ShieldAlert, TriangleAlert } from 'lucide-react';

import type { RiskLevel } from '@/features/inventory/types';

const riskCopy = {
  red: {
    title: 'RED — Update blocked',
    body: 'Dangerous changes need action before this feed is used.',
    className: 'border-red-200 bg-red-50 text-red-950',
    iconClassName: 'bg-red-600 text-white',
    Icon: ShieldAlert,
  },
  yellow: {
    title: 'YELLOW — Review required',
    body: 'Review the flagged changes before approving this feed.',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    iconClassName: 'bg-amber-500 text-amber-950',
    Icon: TriangleAlert,
  },
  green: {
    title: 'GREEN — No meaningful risk detected',
    body: 'The configured checks did not find a blocking change.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    iconClassName: 'bg-emerald-600 text-white',
    Icon: CheckCircle2,
  },
} as const;

export function RiskBanner({ level }: { level: RiskLevel }) {
  const copy = riskCopy[level];
  const Icon = copy.Icon;
  return (
    <section className={`rounded-2xl border p-6 sm:p-8 ${copy.className}`}>
      <div className="flex items-start gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${copy.iconClassName}`}>
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-6 opacity-75">{copy.body}</p>
        </div>
      </div>
    </section>
  );
}
