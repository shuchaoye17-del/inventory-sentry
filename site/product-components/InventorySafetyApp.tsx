'use client';

import {
  ArrowLeft,
  ArrowRight,
  History,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { analyzeScan } from '@/features/inventory/analyzeScan';
import { mapInventoryRows } from '@/features/inventory/mapRows';
import { parseCsv } from '@/features/inventory/parseCsv';
import {
  assertSupportedFile,
  parseSupplierFile,
} from '@/features/inventory/parseFile';
import { DEFAULT_THRESHOLDS } from '@/features/inventory/risk';
import type {
  ParsedInventoryFile,
  RawTable,
  ScanResult,
} from '@/features/inventory/types';

import {
  ColumnMapper,
  type ColumnMapping,
  isValidMapping,
} from './ColumnMapper';
import { FileDrop } from './FileDrop';
import { FilePreview } from './FilePreview';
import { ResultsDashboard } from './ResultsDashboard';
import type { UploadedTable } from './types';

type Screen = 'upload' | 'mapping' | 'results' | 'history';
type FileSlot = 'current' | 'previous' | 'shopify';

const EMPTY_MAPPING: ColumnMapping = { skuColumn: '', quantityColumn: '' };

const primitiveCell = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';

function AppHeader({ onHistory }: { onHistory: () => void }) {
  return (
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
        <Button variant="ghost" className="text-muted-foreground" onClick={onHistory}>
          <History aria-hidden="true" />
          Scan history
        </Button>
      </div>
    </header>
  );
}

function PrivacyRail() {
  return (
    <div className="border-y border-emerald-800/15 bg-emerald-50/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 text-sm text-emerald-950 lg:px-8">
        <LockKeyhole aria-hidden="true" className="size-4 text-emerald-700" />
        <strong>Local safety boundary</strong>
        <span className="text-emerald-900/70">
          Files are processed in your browser and are not uploaded.
        </span>
      </div>
    </div>
  );
}

export function InventorySafetyApp() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [current, setCurrent] = useState<UploadedTable>();
  const [previous, setPrevious] = useState<UploadedTable>();
  const [shopify, setShopify] = useState<UploadedTable>();
  const [currentMapping, setCurrentMapping] =
    useState<ColumnMapping>(EMPTY_MAPPING);
  const [previousMapping, setPreviousMapping] =
    useState<ColumnMapping>(EMPTY_MAPPING);
  const [shopifySkuColumn, setShopifySkuColumn] = useState('');
  const [loadingSlot, setLoadingSlot] = useState<FileSlot>();
  const [errors, setErrors] = useState<Partial<Record<FileSlot, string>>>({});
  const [analysisError, setAnalysisError] = useState('');
  const [result, setResult] = useState<ScanResult>();
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const readFile = async (
    slot: FileSlot,
    file: File,
    parser: (input: File) => Promise<RawTable>,
    save: (upload: UploadedTable) => void,
  ) => {
    setLoadingSlot(slot);
    setErrors((currentErrors) => ({ ...currentErrors, [slot]: undefined }));
    try {
      const table = await parser(file);
      save({ fileName: file.name, table });
      if (slot === 'current') setCurrentMapping(EMPTY_MAPPING);
      if (slot === 'previous') setPreviousMapping(EMPTY_MAPPING);
      if (slot === 'shopify') setShopifySkuColumn('');
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [slot]: error instanceof Error ? error.message : 'The file could not be read.',
      }));
    } finally {
      setLoadingSlot(undefined);
    }
  };

  const parseShopify = async (file: File) => {
    assertSupportedFile(file, 'shopify');
    return parseCsv(file);
  };

  const loadSample = async () => {
    setLoadingSlot('current');
    setErrors((currentErrors) => ({ ...currentErrors, current: undefined }));
    try {
      const response = await fetch('/samples/clean-current.csv');
      if (!response.ok) throw new Error('The sample file is unavailable.');
      const file = new File([await response.blob()], 'clean-current.csv', {
        type: 'text/csv',
      });
      const table = await parseSupplierFile(file);
      setCurrent({ fileName: file.name, table });
      setCurrentMapping({ skuColumn: 'SKU', quantityColumn: 'Quantity' });
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        current: error instanceof Error ? error.message : 'The sample could not be loaded.',
      }));
    } finally {
      setLoadingSlot(undefined);
    }
  };

  const mappingReady =
    !!current &&
    isValidMapping(current.table.headers, currentMapping) &&
    (!previous ||
      isValidMapping(previous.table.headers, previousMapping)) &&
    (!shopify || shopify.table.headers.includes(shopifySkuColumn));

  const runAnalysis = (activeThresholds = thresholds) => {
    if (!current || !mappingReady) return;
    setAnalysisError('');
    try {
      const toInventory = (
        upload: UploadedTable,
        mapping: ColumnMapping,
      ): ParsedInventoryFile => ({
        fileName: upload.fileName,
        headers: upload.table.headers,
        rows: mapInventoryRows(
          upload.table,
          mapping.skuColumn,
          mapping.quantityColumn,
        ),
        skuColumn: mapping.skuColumn,
        quantityColumn: mapping.quantityColumn,
      });
      const nextResult = analyzeScan({
        current: toInventory(current, currentMapping),
        previous: previous ? toInventory(previous, previousMapping) : undefined,
        shopifySkus: shopify
          ? shopify.table.rows.map((row) => primitiveCell(row[shopifySkuColumn]))
          : undefined,
        shopifyFileName: shopify?.fileName,
        thresholds: activeThresholds,
      });
      setResult(nextResult);
      setScreen('results');
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : 'The safety check could not run.',
      );
    }
  };

  if (screen === 'history') {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader onHistory={() => undefined} />
        <PrivacyRail />
        <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
          <Button variant="ghost" onClick={() => setScreen(current ? 'mapping' : 'upload')}>
            <ArrowLeft aria-hidden="true" /> Back to scan
          </Button>
          <h1 className="mt-8 text-3xl font-semibold tracking-[-0.035em]">Scan history</h1>
          <p className="mt-3 text-muted-foreground">No saved scan decisions yet.</p>
        </section>
      </main>
    );
  }

  if (screen === 'results' && result) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader onHistory={() => setScreen('history')} />
        <PrivacyRail />
        <ResultsDashboard
          result={result}
          thresholds={thresholds}
          onBack={() => setScreen('mapping')}
          onThresholdsChange={(nextThresholds) => {
            setThresholds(nextThresholds);
            runAnalysis(nextThresholds);
          }}
        />
      </main>
    );
  }

  if (screen === 'mapping' && current) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader onHistory={() => setScreen('history')} />
        <PrivacyRail />
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-link">Preflight control 02</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Map columns and add context</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Tell the checker which fields matter. Add comparison files only when they are available.
              </p>
            </div>
            <Button variant="outline" onClick={() => setScreen('upload')}>
              <ArrowLeft aria-hidden="true" /> Back
            </Button>
          </div>

          <div className="mt-9 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Current supplier file</h2>
                  <p className="text-sm text-muted-foreground">Required · choose the source fields</p>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Required</span>
              </div>
              <FilePreview fileName={current.fileName} table={current.table} />
              <div className="mt-5">
                <ColumnMapper headers={current.table.headers} labelPrefix="Current" value={currentMapping} onChange={setCurrentMapping} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold">Previous known-good file</h2>
              <p className="mt-1 text-sm text-muted-foreground">Optional · enables change and mass-anomaly checks</p>
              <div className="mt-5">
                {previous ? (
                  <div className="space-y-5">
                    <FilePreview fileName={previous.fileName} table={previous.table} />
                    <ColumnMapper headers={previous.table.headers} labelPrefix="Previous" value={previousMapping} onChange={setPreviousMapping} />
                  </div>
                ) : (
                  <FileDrop label="Previous known-good file" buttonLabel="Upload previous file" accept=".csv,.xlsx" hint="CSV or XLSX, up to 20 MB." loading={loadingSlot === 'previous'} error={errors.previous} onFile={(file) => void readFile('previous', file, parseSupplierFile, setPrevious)} />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold">Shopify product export</h2>
              <p className="mt-1 text-sm text-muted-foreground">Optional · checks supplier SKUs against Shopify</p>
              <div className="mt-5">
                {shopify ? (
                  <div className="space-y-5">
                    <FilePreview fileName={shopify.fileName} table={shopify.table} />
                    <label className="grid max-w-md gap-2 text-sm font-semibold">
                      Shopify SKU column
                      <select className="h-11 rounded-lg border border-input bg-card px-3 font-normal" aria-label="Shopify SKU column" value={shopifySkuColumn} onChange={(event) => setShopifySkuColumn(event.currentTarget.value)}>
                        <option value="">Choose a column</option>
                        {shopify.table.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                      </select>
                    </label>
                  </div>
                ) : (
                  <FileDrop label="Shopify product export" buttonLabel="Upload Shopify export" accept=".csv" hint="CSV export only, up to 20 MB." loading={loadingSlot === 'shopify'} error={errors.shopify} onFile={(file) => void readFile('shopify', file, parseShopify, setShopify)} />
                )}
              </div>
            </section>
          </div>

          <div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-[0_16px_50px_rgba(20,36,61,0.14)] backdrop-blur">
            <p className="text-sm text-muted-foreground">
              {mappingReady ? 'Mappings ready. Run the local safety check.' : 'Complete every required mapping to continue.'}
            </p>
            <Button size="lg" disabled={!mappingReady} onClick={() => runAnalysis()}>
              Run safety check <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          {analysisError ? <p role="alert" className="mt-4 text-sm font-medium text-destructive">{analysisError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader onHistory={() => setScreen('history')} />
      <section className="border-b border-border/80 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
              <span className="size-1.5 rounded-full bg-signal-green" /> Preflight control 01
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[3.75rem]">
              Catch dangerous inventory changes before Shopify does.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              Compare supplier feeds, surface risky SKU changes, and make a clear approve-or-reject decision before any update goes live.
            </p>
          </div>
          <aside className="self-end rounded-2xl border border-white/14 bg-white/7 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-signal-green/15 text-signal-green"><LockKeyhole aria-hidden="true" className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold">Local processing boundary</p>
                <p className="mt-1 text-sm leading-6 text-white/62">Files are processed in your browser and are not uploaded. Raw rows are never stored in scan history.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_18px_50px_rgba(24,36,56,0.06)] sm:p-8">
          {current ? (
            <div className="space-y-6">
              <FilePreview fileName={current.fileName} table={current.table} />
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="outline" onClick={() => setCurrent(undefined)}><RotateCcw aria-hidden="true" /> Choose another file</Button>
                <Button size="lg" onClick={() => setScreen('mapping')}>Continue to mapping <ArrowRight aria-hidden="true" /></Button>
              </div>
            </div>
          ) : (
            <>
              <FileDrop label="Current supplier file" buttonLabel="Upload current supplier file" accept=".csv,.xlsx" hint="CSV or XLSX, up to 20 MB. You will choose the SKU and quantity columns next." loading={loadingSlot === 'current'} error={errors.current} onFile={(file) => void readFile('current', file, parseSupplierFile, setCurrent)} />
              <button type="button" className="mt-4 w-full text-sm font-medium text-link underline-offset-4 hover:underline" disabled={loadingSlot === 'current'} onClick={() => void loadSample()}>
                Try sample inventory instead
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
