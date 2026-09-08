import {
  ArrowRight,
  FileSpreadsheet,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[10px] bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold tracking-[-0.02em]">Inventory Sentry</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Shopify feed safety
              </p>
            </div>
          </div>
          <Button variant="ghost" className="text-muted-foreground">
            Scan history
          </Button>
        </div>
      </header>

      <section className="border-b border-border/80 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
              <span className="size-1.5 rounded-full bg-signal-green" />
              Preflight control 01
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[3.75rem]">
              Catch dangerous inventory changes before Shopify does.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              Compare supplier feeds, surface risky SKU changes, and make a clear
              approve-or-reject decision before any update goes live.
            </p>
          </div>

          <aside className="self-end rounded-2xl border border-white/14 bg-white/7 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-signal-green/15 text-signal-green">
                <LockKeyhole aria-hidden="true" className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Local processing boundary</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  Files are processed in your browser and are not uploaded. Raw
                  rows are never stored in scan history.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-14">
        <Card className="border border-border bg-card shadow-[0_18px_50px_rgba(24,36,56,0.06)] ring-0">
          <CardHeader className="border-b border-border px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <FileSpreadsheet aria-hidden="true" className="size-5" />
              </span>
              <div>
                <CardTitle className="text-lg">Run a safety check</CardTitle>
                <CardDescription>
                  Start with the supplier file you are about to use.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-7 sm:px-8">
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted px-6 py-10 text-center">
              <p className="text-sm font-semibold">Current supplier inventory</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                CSV or XLSX, up to 20 MB. You will choose the SKU and quantity
                columns next.
              </p>
              <Button size="lg" className="mt-6 min-w-64 justify-between px-4">
                Upload current supplier file
                <ArrowRight aria-hidden="true" />
              </Button>
              <button
                type="button"
                className="mt-4 block w-full text-sm font-medium text-link underline-offset-4 hover:underline"
              >
                Try sample inventory instead
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Safety sequence
          </p>
          {[
            ['01', 'Map columns', 'Choose the exact SKU and quantity fields.'],
            ['02', 'Compare states', 'Add a known-good file when you have one.'],
            ['03', 'Decide safely', 'Review every flag before approval.'],
          ].map(([number, title, copy]) => (
            <div
              key={number}
              className="grid grid-cols-[42px_1fr] gap-3 border-t border-border py-4"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {number}
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
