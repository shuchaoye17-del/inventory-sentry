# Shopify Inventory Safety MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static browser application that locally validates supplier inventory files, compares them with optional prior and Shopify exports, and produces explainable GREEN/YELLOW/RED decisions without uploading raw data.

**Architecture:** A Vite React TypeScript SPA keeps uploaded data in memory, separates parsing from pure deterministic inventory analysis, and persists only compact scan summaries to IndexedDB. Page-level orchestration owns the multi-step workflow while focused domain modules provide independently tested parsing, mapping, comparison, risk, export, and persistence APIs.

**Tech Stack:** Node.js 24, pnpm 11, Vite, React, TypeScript, Tailwind CSS, PapaParse, SheetJS `xlsx`, Zod, `idb-keyval`, Vitest, React Testing Library, and Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-shopify-inventory-safety-mvp-design.md`

**Application root:** `site/`. All application file paths and package commands below are relative to `site/`; repository-level design and plan documents remain under `docs/`.

## Global Constraints

- Process all supplier and Shopify file contents entirely in the browser.
- Never send inventory content to a backend or analytics endpoint.
- Never persist raw files, raw tables, or full normalized inventories.
- Accept only `.csv` and `.xlsx` supplier files and a `.csv` Shopify export.
- Reject input files larger than 20 MB before parsing.
- Use deterministic rule templates; do not generate explanations with AI.
- Keep Shopify OAuth, inventory writes, backend storage, accounts, billing, scheduling, and multi-tenant features out of scope.
- Use bundled synthetic fixtures only; never include client data.
- Every behavior change starts with a failing test and ends with targeted verification.

## File Map

- `package.json`: scripts and runtime/development dependencies.
- `vite.config.ts`, `tsconfig*.json`, `index.html`: build and TypeScript setup.
- `playwright.config.ts`: critical browser flow configuration.
- `src/main.tsx`, `src/app/App.tsx`: application entry and workflow shell.
- `src/app/scanContext.tsx`: in-memory raw table, mapping, result, and navigation state.
- `src/styles/index.css`: Tailwind entry plus the product's visual tokens and layout utilities.
- `src/features/inventory/types.ts`: stable domain and raw-table types.
- `src/features/inventory/risk.ts`: default thresholds and risk aggregation.
- `src/features/inventory/parseCsv.ts`, `parseXlsx.ts`, `parseFile.ts`: local file parsing and shared input guards.
- `src/features/inventory/mapRows.ts`: mapped inventory row normalization.
- `src/features/inventory/analyzeSingleFile.ts`: current-file validity checks.
- `src/features/inventory/compareInventories.ts`: prior-file change rules.
- `src/features/inventory/compareShopifyExport.ts`: optional Shopify SKU rules.
- `src/features/inventory/analyzeScan.ts`: deterministic analysis orchestration.
- `src/features/inventory/explanations.ts`: fixed plain-language issue descriptions.
- `src/features/inventory/report.ts`: JSON and CSV blob creation.
- `src/features/inventory/history.ts`: IndexedDB summary persistence.
- `src/components/*`: focused upload, mapping, banner, table, threshold, and action views.
- `src/pages/UploadPage.tsx`, `MappingPage.tsx`, `ResultsPage.tsx`, `HistoryPage.tsx`: workflow pages.
- `src/test/*`: test setup, fixtures, and focused unit/component tests.
- `e2e/inventory-safety.spec.ts`: RED and GREEN browser journeys.
- `README.md`: local use, privacy, testing, deployment, and limitations.

---

### Task 1: Application shell and test harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/styles/index.css`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: `App(): JSX.Element`; scripts `dev`, `build`, `test`, `test:e2e`, and `lint:type`.

- [x] **Step 1: Write the shell test**

```tsx
// src/app/App.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the inventory safety promise and upload action', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /catch dangerous inventory changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload current supplier file/i })).toBeInTheDocument();
    expect(screen.getByText(/processed in your browser and are not uploaded/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Create configuration and install dependencies**

```json
{
  "name": "inventory-sentry",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint:type": "tsc -b --pretty false"
  }
}
```

Install runtime packages with `pnpm add react react-dom papaparse xlsx zod idb-keyval` and development packages with `pnpm add -D typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @types/papaparse @playwright/test`.

- [x] **Step 3: Run the shell test and confirm failure**

Run: `pnpm test -- src/app/App.test.tsx`

Expected: FAIL because `src/app/App.tsx` does not exist.

- [x] **Step 4: Implement the minimal shell**

```tsx
// src/app/App.tsx
export function App() {
  return (
    <main>
      <p>Inventory Sentry</p>
      <h1>Catch dangerous inventory changes before Shopify does.</h1>
      <p>Files are processed in your browser and are not uploaded.</p>
      <button type="button">Upload current supplier file</button>
    </main>
  );
}
```

Configure Vite with React, Tailwind, and Vitest `jsdom`; import `@testing-library/jest-dom/vitest` from `src/test/setup.ts`; render `<App />` from `src/main.tsx`; include `@import "tailwindcss";` in `src/styles/index.css`.

- [x] **Step 5: Verify the harness**

Run: `pnpm test -- src/app/App.test.tsx && pnpm lint:type && pnpm build`

Expected: all commands exit 0 and Vite writes `dist/`.

- [x] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml index.html vite.config.ts tsconfig*.json playwright.config.ts src
git commit -m "chore: scaffold inventory safety mvp"
```

### Task 2: Domain types and risk aggregation

**Files:**
- Create: `src/features/inventory/types.ts`
- Create: `src/features/inventory/risk.ts`
- Create: `src/features/inventory/risk.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `RawTable`, `InventoryRow`, `ParsedInventoryFile`, `InventoryIssue`, `AnalysisThresholds`, `ScanResult`, `ScanDecision`, `DEFAULT_THRESHOLDS`, and `highestRisk(issues)`.

- [x] **Step 1: Write the risk tests**

```ts
import { describe, expect, it } from 'vitest';
import { highestRisk } from './risk';

describe('highestRisk', () => {
  it('returns green with no issues', () => expect(highestRisk([])).toBe('green'));
  it('returns yellow for yellow issues', () => {
    expect(highestRisk([{ code: 'NEW_SKU', level: 'yellow', message: 'New SKU' }])).toBe('yellow');
  });
  it('returns red when any issue is red', () => {
    expect(highestRisk([
      { code: 'NEW_SKU', level: 'yellow', message: 'New SKU' },
      { code: 'DUPLICATE_SKU', level: 'red', message: 'Duplicate SKU' },
    ])).toBe('red');
  });
});
```

- [x] **Step 2: Run the tests and confirm failure**

Run: `pnpm test -- src/features/inventory/risk.test.ts`

Expected: FAIL because `risk.ts` does not exist.

- [x] **Step 3: Define the stable domain API**

```ts
export type RiskLevel = 'green' | 'yellow' | 'red';
export type RawTable = { headers: string[]; rows: Record<string, unknown>[] };
export type InventoryRow = {
  rowNumber: number;
  sku: string;
  quantity: number | null;
  rawSku: unknown;
  rawQuantity: unknown;
};
export type ParsedInventoryFile = {
  fileName: string;
  headers: string[];
  rows: InventoryRow[];
  skuColumn: string;
  quantityColumn: string;
};
export type IssueCode =
  | 'EMPTY_SKU' | 'DUPLICATE_SKU' | 'CASE_COLLISION'
  | 'BLANK_QUANTITY' | 'INVALID_QUANTITY' | 'NON_INTEGER_QUANTITY' | 'NEGATIVE_QUANTITY'
  | 'SCHEMA_DRIFT' | 'MISSING_SKU' | 'NEW_SKU' | 'ZEROED_SKU'
  | 'LARGE_DROP' | 'LARGE_INCREASE' | 'MASS_ZEROING' | 'MASS_MISSING' | 'MASS_NEW'
  | 'UNKNOWN_SHOPIFY_SKU' | 'DUPLICATE_SHOPIFY_SKU';
export type InventoryIssue = {
  code: IssueCode;
  level: Exclude<RiskLevel, 'green'>;
  sku?: string;
  rowNumber?: number;
  message: string;
  previousQuantity?: number;
  currentQuantity?: number;
  affectedCount?: number;
};
export type AnalysisThresholds = {
  largeChangePercent: number;
  largeChangeAbsolute: number;
  massZeroCount: number;
  massZeroPercent: number;
  massMissingCount: number;
  massMissingPercent: number;
  massNewCount: number;
  massNewPercent: number;
};
export type ScanResult = {
  id: string;
  createdAt: string;
  currentFileName: string;
  previousFileName?: string;
  shopifyFileName?: string;
  level: RiskLevel;
  issues: InventoryIssue[];
  counts: { currentRows: number; matchedRows: number; redIssues: number; yellowIssues: number };
};
export type ScanDecision = 'approved' | 'rejected' | 'undecided';
```

- [x] **Step 4: Implement risk defaults and aggregation**

```ts
export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  largeChangePercent: 0.8,
  largeChangeAbsolute: 10,
  massZeroCount: 20,
  massZeroPercent: 0.2,
  massMissingCount: 20,
  massMissingPercent: 0.1,
  massNewCount: 20,
  massNewPercent: 0.1,
};

export function highestRisk(issues: InventoryIssue[]): RiskLevel {
  if (issues.some((issue) => issue.level === 'red')) return 'red';
  if (issues.some((issue) => issue.level === 'yellow')) return 'yellow';
  return 'green';
}
```

- [x] **Step 5: Verify and commit**

Run: `pnpm test -- src/features/inventory/risk.test.ts && pnpm lint:type`

```bash
git add src/features/inventory/types.ts src/features/inventory/risk.ts src/features/inventory/risk.test.ts
git commit -m "feat: define inventory risk model"
```

### Task 3: Local CSV and XLSX parsing

**Files:**
- Create: `src/features/inventory/parseFile.ts`
- Create: `src/features/inventory/parseCsv.ts`
- Create: `src/features/inventory/parseXlsx.ts`
- Create: `src/features/inventory/parseFile.test.ts`

**Interfaces:**
- Consumes: `RawTable`.
- Produces: `MAX_FILE_BYTES`, `assertSupportedFile(file, kind)`, `validateRawTable(table)`, `parseCsv(file)`, `parseXlsx(file)`, and `parseSupplierFile(file)`.

- [x] **Step 1: Write parser guard tests**

```ts
import { describe, expect, it } from 'vitest';
import { parseCsv } from './parseCsv';
import { assertSupportedFile, validateRawTable } from './parseFile';

describe('inventory file parsing', () => {
  it('parses raw CSV values', async () => {
    const file = new File(['SKU,Qty\nA-1,12\n'], 'current.csv', { type: 'text/csv' });
    await expect(parseCsv(file)).resolves.toEqual({ headers: ['SKU', 'Qty'], rows: [{ SKU: 'A-1', Qty: '12' }] });
  });
  it('rejects duplicate headers', () => {
    expect(() => validateRawTable({ headers: ['SKU', 'SKU'], rows: [] })).toThrow(/duplicate header/i);
  });
  it('rejects files over 20 MB', () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.csv');
    expect(() => assertSupportedFile(file, 'supplier')).toThrow(/20 MB/i);
  });
});
```

- [x] **Step 2: Run the tests and confirm failure**

Run: `pnpm test -- src/features/inventory/parseFile.test.ts`

Expected: FAIL because parser modules do not exist.

- [x] **Step 3: Implement guards and CSV parsing**

```ts
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function validateRawTable(table: RawTable): RawTable {
  if (table.headers.length === 0 || table.headers.every((header) => header.trim() === '')) throw new Error('The file is empty.');
  if (table.headers.some((header) => header.trim() === '')) throw new Error('The file contains an invalid empty header.');
  const normalized = table.headers.map((header) => header.trim().toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new Error('The file contains a duplicate header.');
  return table;
}
```

Use PapaParse in array-of-arrays mode with `skipEmptyLines: 'greedy'`, reject any parser error, take the first row as the untouched header row, and call `validateRawTable` before building header/value records. This detects duplicate headers before PapaParse can rename them. Keep returned cell values untouched.

- [x] **Step 4: Implement XLSX and supplier routing**

```ts
export async function parseSupplierFile(file: File): Promise<RawTable> {
  assertSupportedFile(file, 'supplier');
  return file.name.toLocaleLowerCase().endsWith('.xlsx') ? parseXlsx(file) : parseCsv(file);
}
```

Read `await file.arrayBuffer()` with SheetJS, select `workbook.SheetNames[0]`, obtain an array-of-arrays with `header: 1`, build explicit header/value records so duplicate headers are detectable, and preserve numeric worksheet cells as numbers.

- [x] **Step 5: Verify and commit**

Run: `pnpm test -- src/features/inventory/parseFile.test.ts && pnpm lint:type`

```bash
git add src/features/inventory/parse*.ts src/features/inventory/parseFile.test.ts
git commit -m "feat: parse supplier csv and xlsx files"
```

### Task 4: Row normalization and current-file validation

**Files:**
- Create: `src/features/inventory/mapRows.ts`
- Create: `src/features/inventory/analyzeSingleFile.ts`
- Create: `src/features/inventory/analyzeSingleFile.test.ts`
- Create: `src/test/fixtures/clean-current.csv`
- Create: `src/test/fixtures/duplicate-sku.csv`
- Create: `src/test/fixtures/invalid-quantity.csv`

**Interfaces:**
- Consumes: `RawTable`, `InventoryRow`, and `InventoryIssue`.
- Produces: `mapInventoryRows(table, skuColumn, quantityColumn)` and `analyzeSingleFile(rows)`.

- [x] **Step 1: Write table-driven validation tests**

```ts
import { describe, expect, it } from 'vitest';
import { analyzeSingleFile } from './analyzeSingleFile';
import { mapInventoryRows } from './mapRows';

const issuesFor = (sku: unknown, quantity: unknown) => analyzeSingleFile(mapInventoryRows({
  headers: ['SKU', 'Qty'], rows: [{ SKU: sku, Qty: quantity }],
}, 'SKU', 'Qty'));

describe('current inventory validation', () => {
  it.each([
    ['', 4, 'EMPTY_SKU'],
    ['A', '', 'BLANK_QUANTITY'],
    ['A', 'many', 'INVALID_QUANTITY'],
    ['A', '1.5', 'NON_INTEGER_QUANTITY'],
    ['A', '-1', 'NEGATIVE_QUANTITY'],
  ] as const)('maps %s/%s to %s', (sku, quantity, code) => {
    expect(issuesFor(sku, quantity).map((issue) => issue.code)).toContain(code);
  });
  it('finds exact and case-only duplicates', () => {
    const rows = mapInventoryRows({ headers: ['SKU', 'Qty'], rows: [
      { SKU: ' A ', Qty: '2' }, { SKU: 'A', Qty: '3' }, { SKU: 'a', Qty: '4' },
    ] }, 'SKU', 'Qty');
    expect(analyzeSingleFile(rows).map((issue) => issue.code)).toEqual(expect.arrayContaining(['DUPLICATE_SKU', 'CASE_COLLISION']));
  });
});
```

- [x] **Step 2: Run the tests and confirm failure**

Run: `pnpm test -- src/features/inventory/analyzeSingleFile.test.ts`

Expected: FAIL because mapping and validation modules do not exist.

- [x] **Step 3: Implement mapping**

```ts
export function mapInventoryRows(table: RawTable, skuColumn: string, quantityColumn: string): InventoryRow[] {
  if (!table.headers.includes(skuColumn) || !table.headers.includes(quantityColumn) || skuColumn === quantityColumn) {
    throw new Error('Choose different valid SKU and quantity columns.');
  }
  return table.rows.map((record, index) => {
    const rawSku = record[skuColumn];
    const rawQuantity = record[quantityColumn];
    const blank = rawQuantity === null || rawQuantity === undefined || String(rawQuantity).trim() === '';
    const numeric = blank ? null : Number(rawQuantity);
    return {
      rowNumber: index + 2,
      sku: rawSku === null || rawSku === undefined ? '' : String(rawSku).trim(),
      quantity: numeric !== null && Number.isFinite(numeric) ? numeric : null,
      rawSku,
      rawQuantity,
    };
  });
}
```

- [x] **Step 4: Implement deterministic issue generation**

Use one row pass for SKU and quantity issues, an exact SKU frequency map for `DUPLICATE_SKU`, and a lowercase-to-original-values map for `CASE_COLLISION`. Emit one issue per affected row/SKU with fixed messages and row numbers; do not emit case collision merely because the same exact spelling repeats.

```ts
const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === '';
const isNumeric = (value: unknown) => !isBlank(value) && Number.isFinite(Number(value));
```

- [x] **Step 5: Verify and commit**

Run: `pnpm test -- src/features/inventory/analyzeSingleFile.test.ts && pnpm lint:type`

```bash
git add src/features/inventory/mapRows.ts src/features/inventory/analyzeSingleFile.ts src/features/inventory/analyzeSingleFile.test.ts src/test/fixtures
git commit -m "feat: validate supplier inventory rows"
```

### Task 5: Previous-inventory comparison

**Files:**
- Create: `src/features/inventory/compareInventories.ts`
- Create: `src/features/inventory/compareInventories.test.ts`
- Create: `src/test/fixtures/previous-good.csv`
- Create: `src/test/fixtures/mass-zero-current.csv`
- Create: `src/test/fixtures/schema-drift-current.csv`

**Interfaces:**
- Consumes: `ParsedInventoryFile`, `AnalysisThresholds`, `InventoryIssue`, and `DEFAULT_THRESHOLDS`.
- Produces: `compareInventories(current, previous, thresholds)`.

- [x] **Step 1: Write focused threshold tests**

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLDS } from './risk';
import { compareInventories } from './compareInventories';

const inventory = (headers: string[], values: Array<[string, number]>) => ({
  fileName: 'file.csv', headers, skuColumn: 'SKU', quantityColumn: 'Qty',
  rows: values.map(([sku, quantity], index) => ({ rowNumber: index + 2, sku, quantity, rawSku: sku, rawQuantity: quantity })),
});

describe('inventory comparison', () => {
  it('marks a qualifying large drop red', () => {
    const issues = compareInventories(inventory(['SKU', 'Qty'], [['A', 10]]), inventory(['SKU', 'Qty'], [['A', 100]]), DEFAULT_THRESHOLDS);
    expect(issues).toContainEqual(expect.objectContaining({ code: 'LARGE_DROP', level: 'red', sku: 'A', previousQuantity: 100, currentQuantity: 10 }));
  });
  it('does not mark a drop when only one threshold is crossed', () => {
    const issues = compareInventories(inventory(['SKU', 'Qty'], [['A', 89]]), inventory(['SKU', 'Qty'], [['A', 100]]), DEFAULT_THRESHOLDS);
    expect(issues.map((issue) => issue.code)).not.toContain('LARGE_DROP');
  });
  it('marks changed headers yellow', () => {
    const issues = compareInventories(inventory(['SKU', 'Quantity'], [['A', 1]]), inventory(['SKU', 'Qty'], [['A', 1]]), DEFAULT_THRESHOLDS);
    expect(issues).toContainEqual(expect.objectContaining({ code: 'SCHEMA_DRIFT', level: 'yellow' }));
  });
});
```

- [x] **Step 2: Run the tests and confirm failure**

Run: `pnpm test -- src/features/inventory/compareInventories.test.ts`

Expected: FAIL because the comparison module does not exist.

- [x] **Step 3: Implement per-SKU comparison**

Build maps from valid, non-empty SKU rows. For prior-only SKUs emit `MISSING_SKU`; for current-only SKUs emit `NEW_SKU`; for matched SKUs emit `ZEROED_SKU`, `LARGE_DROP`, or `LARGE_INCREASE` according to the exact thresholds.

```ts
const crossesLargeChange = (previous: number, current: number, thresholds: AnalysisThresholds) => {
  const absolute = Math.abs(current - previous);
  const percent = absolute / Math.max(previous, 1);
  return absolute >= thresholds.largeChangeAbsolute && percent >= thresholds.largeChangePercent;
};
```

- [x] **Step 4: Implement aggregate escalation**

Calculate zeroing as matched previous-positive rows whose current quantity is zero, missing as prior-only rows, and new as current-only rows. Use the number of valid previous SKUs as the denominator for mass zeroing and mass missing, and the number of valid current SKUs as the denominator for mass new. Cross an aggregate threshold only when both count and percentage conditions are met. Emit one aggregate issue with `affectedCount`; retain individual YELLOW issues for transparent SKU-level detail.

```ts
const crossesMassThreshold = (count: number, denominator: number, minimumCount: number, minimumPercent: number) =>
  count >= minimumCount && denominator > 0 && count / denominator >= minimumPercent;
```

- [x] **Step 5: Verify all comparison categories and commit**

Add explicit cases for missing, new, zeroed, large increase, mass zero, mass missing, and mass new, then run:

`pnpm test -- src/features/inventory/compareInventories.test.ts && pnpm lint:type`

```bash
git add src/features/inventory/compareInventories.ts src/features/inventory/compareInventories.test.ts src/test/fixtures
git commit -m "feat: detect dangerous inventory changes"
```

### Task 6: Shopify export comparison and scan orchestration

**Files:**
- Create: `src/features/inventory/compareShopifyExport.ts`
- Create: `src/features/inventory/compareShopifyExport.test.ts`
- Create: `src/features/inventory/analyzeScan.ts`
- Create: `src/features/inventory/analyzeScan.test.ts`
- Create: `src/features/inventory/explanations.ts`
- Create: `src/test/fixtures/shopify-export.csv`
- Create: `src/test/fixtures/unknown-sku-current.csv`

**Interfaces:**
- Consumes: all pure analysis functions and domain types.
- Produces: `compareShopifySkus(currentRows, shopifySkus)`, `analyzeScan(input)`, and `issueMessage(code, values)`.

- [x] **Step 1: Write Shopify comparison tests**

```ts
import { describe, expect, it } from 'vitest';
import { compareShopifySkus } from './compareShopifyExport';

const row = (sku: string) => ({ rowNumber: 2, sku, quantity: 1, rawSku: sku, rawQuantity: 1 });

describe('Shopify SKU comparison', () => {
  it('reports unknown supplier and duplicated Shopify SKUs', () => {
    const issues = compareShopifySkus([row('SUP-2')], ['SUP-1', 'SUP-1']);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['UNKNOWN_SHOPIFY_SKU', 'DUPLICATE_SHOPIFY_SKU']));
    expect(issues.every((issue) => issue.level === 'yellow')).toBe(true);
  });
});
```

- [x] **Step 2: Run the test and confirm failure**

Run: `pnpm test -- src/features/inventory/compareShopifyExport.test.ts`

Expected: FAIL because the Shopify comparison module does not exist.

- [x] **Step 3: Implement Shopify comparison**

Trim Shopify SKUs, ignore blanks, count exact values, report every duplicated value once, and report each non-empty supplier SKU absent from the Shopify set.

```ts
export function compareShopifySkus(currentRows: InventoryRow[], shopifySkus: string[]): InventoryIssue[] {
  const normalized = shopifySkus.map((sku) => sku.trim()).filter(Boolean);
  const counts = new Map<string, number>();
  normalized.forEach((sku) => counts.set(sku, (counts.get(sku) ?? 0) + 1));
  const available = new Set(normalized);
  const duplicateIssues = [...counts].filter(([, count]) => count > 1).map(([sku]) => duplicateShopifyIssue(sku));
  const unknownIssues = currentRows.filter((item) => item.sku && !available.has(item.sku)).map((item) => unknownShopifyIssue(item));
  return [...duplicateIssues, ...unknownIssues];
}
```

- [x] **Step 4: Write and implement orchestration**

Test that `analyzeScan` combines current validation, optional prior comparison, and optional Shopify comparison; counts red/yellow issues; calculates matched rows; and calls `highestRisk`.

```ts
export type AnalyzeScanInput = {
  current: ParsedInventoryFile;
  previous?: ParsedInventoryFile;
  shopifySkus?: string[];
  shopifyFileName?: string;
  thresholds: AnalysisThresholds;
};
export function analyzeScan(input: AnalyzeScanInput): ScanResult;
```

Use `crypto.randomUUID()` for `id`, `new Date().toISOString()` for `createdAt`, and fixed `issueMessage` templates for every `IssueCode`.

- [x] **Step 5: Verify and commit**

Run: `pnpm test -- src/features/inventory/compareShopifyExport.test.ts src/features/inventory/analyzeScan.test.ts && pnpm lint:type`

```bash
git add src/features/inventory/compareShopifyExport* src/features/inventory/analyzeScan* src/features/inventory/explanations.ts src/test/fixtures
git commit -m "feat: orchestrate deterministic inventory analysis"
```

### Task 7: Upload and column-mapping workflow

**Files:**
- Create: `src/app/scanContext.tsx`
- Create: `src/components/FileDrop.tsx`
- Create: `src/components/FilePreview.tsx`
- Create: `src/components/ColumnMapper.tsx`
- Create: `src/components/OptionalInputs.tsx`
- Create: `src/pages/UploadPage.tsx`
- Create: `src/pages/MappingPage.tsx`
- Create: `src/pages/MappingPage.test.tsx`
- Create: `src/components/ColumnMapper.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: parser, mapping, and analysis domain APIs.
- Produces: an in-memory `ScanProvider`, upload/mapping components, and page navigation states `'upload' | 'mapping' | 'results' | 'history'`.

- [x] **Step 1: Write mapping interaction tests**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ColumnMapper } from './ColumnMapper';

it('requires different SKU and quantity columns', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ColumnMapper headers={['SKU', 'Qty']} value={{ skuColumn: '', quantityColumn: '' }} onChange={onChange} />);
  await user.selectOptions(screen.getByLabelText(/sku column/i), 'SKU');
  await user.selectOptions(screen.getByLabelText(/quantity column/i), 'SKU');
  expect(screen.getByText(/must be different/i)).toBeInTheDocument();
});
```

- [x] **Step 2: Run the test and confirm failure**

Run: `pnpm test -- src/components/ColumnMapper.test.tsx`

Expected: FAIL because `ColumnMapper` does not exist.

- [x] **Step 3: Implement accessible file and mapping controls**

```ts
export type ColumnMapping = { skuColumn: string; quantityColumn: string };
export const isValidMapping = (headers: string[], mapping: ColumnMapping) =>
  headers.includes(mapping.skuColumn) && headers.includes(mapping.quantityColumn) && mapping.skuColumn !== mapping.quantityColumn;
```

`FileDrop` uses a labeled native file input with `accept` restrictions, drag/drop enhancement, loading state, clear button, and inline errors. `FilePreview` renders filename, row count, headers, and the first five rows. `ColumnMapper` uses two labeled selects and an announced validation message.

- [x] **Step 4: Implement in-memory workflow state**

```ts
export type UploadedTable = { fileName: string; table: RawTable };
export type ScanDraft = {
  current?: UploadedTable;
  currentMapping: ColumnMapping;
  previous?: UploadedTable;
  previousMapping: ColumnMapping;
  shopify?: UploadedTable;
  shopifySkuColumn: string;
  thresholds: AnalysisThresholds;
  result?: ScanResult;
};
```

Keep these values only in React state. `UploadPage` accepts the current file and sample data. `MappingPage` shows the current preview/mapping, optional previous and Shopify sections, disables analysis until all supplied mappings are valid, converts tables to mapped inventories, then calls `analyzeScan`.

- [x] **Step 5: Add workflow tests and verify**

Test that an invalid mapping disables “Run safety check,” a valid current mapping enables it, and a supplied optional file without its mapping keeps it disabled.

Run: `pnpm test -- src/components/ColumnMapper.test.tsx src/pages/MappingPage.test.tsx && pnpm lint:type`

- [x] **Step 6: Commit**

```bash
git add src/app src/components src/pages src/app/App.tsx
git commit -m "feat: add file upload and column mapping"
```

### Task 8: Results dashboard and threshold reruns

**Files:**
- Create: `src/components/RiskBanner.tsx`
- Create: `src/components/IssueTable.tsx`
- Create: `src/components/DiffTable.tsx`
- Create: `src/components/ThresholdPanel.tsx`
- Create: `src/pages/ResultsPage.tsx`
- Create: `src/pages/ResultsPage.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/scanContext.tsx`

**Interfaces:**
- Consumes: `ScanResult`, `AnalysisThresholds`, `IssueCode`, and `analyzeScan`.
- Produces: severity/code filtering, threshold editing, and rerun behavior.

- [x] **Step 1: Write dashboard behavior tests**

```tsx
it('shows risk, counts, explanations, and filters', async () => {
  render(<ResultsPage result={redResult} onThresholdsChange={vi.fn()} thresholds={DEFAULT_THRESHOLDS} />);
  expect(screen.getByRole('heading', { name: /red — update blocked/i })).toBeInTheDocument();
  expect(screen.getByText(/mass_zeroing/i)).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText(/severity/i), 'yellow');
  expect(screen.queryByText(/mass_zeroing/i)).not.toBeInTheDocument();
});
```

- [x] **Step 2: Run the test and confirm failure**

Run: `pnpm test -- src/pages/ResultsPage.test.tsx`

Expected: FAIL because result components do not exist.

- [x] **Step 3: Implement the risk and summary hierarchy**

`RiskBanner` renders a text label, icon, and fixed explanation for each risk level. `ResultsPage` renders current rows, matched rows, red issue count, yellow issue count, “Why this was flagged,” issue filters, the issue table, and a deduplicated diff table.

```ts
const riskCopy = {
  red: { title: 'RED — Update blocked', body: 'Dangerous changes need action before this feed is used.' },
  yellow: { title: 'YELLOW — Review required', body: 'Review the flagged changes before approving this feed.' },
  green: { title: 'GREEN — No meaningful risk detected', body: 'The configured checks did not find a blocking change.' },
} as const;
```

- [x] **Step 4: Implement filtering and threshold reruns**

`IssueTable` filters by `all | red | yellow` and `all | IssueCode`. `ThresholdPanel` is a native `<details>` region with percentage controls displayed as 0–100 values and converted to decimal fractions. Changing thresholds calls the page handler, which reruns `analyzeScan` against the in-memory mapped values without reparsing.

```ts
const percentToFraction = (value: number) => value / 100;
const fractionToPercent = (value: number) => value * 100;
```

- [x] **Step 5: Verify and commit**

Run: `pnpm test -- src/pages/ResultsPage.test.tsx && pnpm lint:type`

```bash
git add src/components/RiskBanner.tsx src/components/IssueTable.tsx src/components/DiffTable.tsx src/components/ThresholdPanel.tsx src/pages/ResultsPage* src/app
git commit -m "feat: add inventory safety results dashboard"
```

### Task 9: Decisions, local history, and report exports

**Files:**
- Create: `src/features/inventory/history.ts`
- Create: `src/features/inventory/history.test.ts`
- Create: `src/features/inventory/report.ts`
- Create: `src/features/inventory/report.test.ts`
- Create: `src/components/ScanActions.tsx`
- Create: `src/pages/HistoryPage.tsx`
- Create: `src/pages/HistoryPage.test.tsx`
- Modify: `src/pages/ResultsPage.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `ScanResult` and `ScanDecision`.
- Produces: `saveScanSummary`, `listScanSummaries`, `exportScanJson`, `exportIssuesCsv`, and decision/history UI.

- [x] **Step 1: Write report tests**

```ts
it('exports JSON and a safely escaped issue CSV', async () => {
  const json = await exportScanJson(result).text();
  expect(JSON.parse(json)).toEqual(result);
  const csv = await exportIssuesCsv({ ...result, issues: [{ code: 'NEW_SKU', level: 'yellow', sku: 'A,1', message: 'Review "A,1"' }] }).text();
  expect(csv).toContain('"A,1"');
  expect(csv).toContain('"Review ""A,1"""');
});
```

- [x] **Step 2: Run report tests and confirm failure**

Run: `pnpm test -- src/features/inventory/report.test.ts`

Expected: FAIL because report functions do not exist.

- [x] **Step 3: Implement local blob reports**

```ts
export function exportScanJson(result: ScanResult): Blob {
  return new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' });
}
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export function exportIssuesCsv(result: ScanResult): Blob {
  const header = ['code', 'severity', 'sku', 'rowNumber', 'previousQuantity', 'currentQuantity', 'message'];
  const rows = result.issues.map((issue) => [issue.code, issue.level, issue.sku, issue.rowNumber, issue.previousQuantity, issue.currentQuantity, issue.message]);
  return new Blob([[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
```

- [x] **Step 4: Write and implement IndexedDB history tests**

Mock `idb-keyval` and verify `saveScanSummary` writes only `{ ...result, decision }`, never a field named `raw`, `rows`, `table`, or `file`. Verify `listScanSummaries` returns newest first.

```ts
export type StoredScanSummary = ScanResult & { decision: ScanDecision };
const HISTORY_KEY = 'inventory-sentry:scan-history:v1';
export async function saveScanSummary(result: ScanResult, decision: ScanDecision): Promise<void>;
export async function listScanSummaries(): Promise<StoredScanSummary[]>;
```

- [x] **Step 5: Implement actions and history page**

`ScanActions` provides Approve, Reject, Export JSON, and Export issue CSV. A decision saves the summary, exposes the selected state, and reports persistence failure without hiding results. `HistoryPage` loads summaries, shows date, filename, risk, counts, and decision, and provides a clear empty state.

- [x] **Step 6: Verify and commit**

Run: `pnpm test -- src/features/inventory/report.test.ts src/features/inventory/history.test.ts src/pages/HistoryPage.test.tsx && pnpm lint:type`

```bash
git add src/features/inventory/history* src/features/inventory/report* src/components/ScanActions.tsx src/pages/HistoryPage* src/pages/ResultsPage.tsx src/app/App.tsx
git commit -m "feat: add local scan decisions history and exports"
```

### Task 10: Synthetic critical-flow browser tests

**Files:**
- Create: `e2e/inventory-safety.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `src/test/fixtures/previous-good.csv`
- Modify: `src/test/fixtures/mass-zero-current.csv`
- Create: `public/samples/clean-current.csv`
- Create: `public/samples/previous-good.csv`
- Create: `public/samples/mass-zero-current.csv`

**Interfaces:**
- Consumes: the complete browser workflow and bundled fixtures.
- Produces: repeatable RED and GREEN acceptance journeys.

- [x] **Step 1: Write the RED journey**

```ts
test('blocks a mass-zero feed and records rejection', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Current supplier file').setInputFiles('src/test/fixtures/mass-zero-current.csv');
  await page.getByRole('button', { name: /continue to mapping/i }).click();
  await page.getByLabel('Current SKU column').selectOption('SKU');
  await page.getByLabel('Current quantity column').selectOption('Quantity');
  await page.getByLabel('Previous known-good file').setInputFiles('src/test/fixtures/previous-good.csv');
  await page.getByLabel('Previous SKU column').selectOption('SKU');
  await page.getByLabel('Previous quantity column').selectOption('Quantity');
  await page.getByRole('button', { name: /run safety check/i }).click();
  await expect(page.getByRole('heading', { name: /red — update blocked/i })).toBeVisible();
  await expect(page.getByText('MASS_ZEROING')).toBeVisible();
  await page.getByRole('button', { name: /reject scan/i }).click();
  await page.getByRole('link', { name: /history/i }).click();
  await expect(page.getByText(/rejected/i)).toBeVisible();
});
```

- [x] **Step 2: Run the RED journey and confirm failure**

Run: `pnpm test:e2e -- --grep "blocks a mass-zero"`

Expected: FAIL at the first incomplete selector or behavior.

- [x] **Step 3: Complete fixture wiring until RED passes**

Configure Playwright `webServer.command` as `pnpm dev --host 127.0.0.1`, use Chromium, and expose stable accessible names matching the scenario. Ensure fixture count and percentages cross both mass-zero thresholds.

- [x] **Step 4: Add the GREEN journey**

```ts
test('passes a clean current feed', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Current supplier file').setInputFiles('src/test/fixtures/clean-current.csv');
  await page.getByRole('button', { name: /continue to mapping/i }).click();
  await page.getByLabel('Current SKU column').selectOption('SKU');
  await page.getByLabel('Current quantity column').selectOption('Quantity');
  await page.getByRole('button', { name: /run safety check/i }).click();
  await expect(page.getByRole('heading', { name: /green — no meaningful risk detected/i })).toBeVisible();
});
```

- [x] **Step 5: Verify and commit**

Run: `pnpm test:e2e`

```bash
git add e2e playwright.config.ts src/test/fixtures public/samples
git commit -m "test: cover critical supplier safety workflow"
```

### Task 11: Visual polish, sample data, documentation, and final verification

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/app/App.tsx`
- Modify: `src/pages/UploadPage.tsx`
- Modify: `src/pages/MappingPage.tsx`
- Modify: `src/pages/ResultsPage.tsx`
- Modify: `src/pages/HistoryPage.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: the completed application.
- Produces: an externally testable, accessible, responsive static MVP.

- [ ] **Step 1: Write polish acceptance assertions**

Extend component and E2E tests to assert the local-processing privacy statement, sample-data action, loading/error states, keyboard-focusable primary actions, responsive table wrappers, and a history empty state.

```tsx
expect(screen.getByText(/files are processed in your browser and are not uploaded/i)).toBeVisible();
expect(screen.getByRole('button', { name: /try sample inventory/i })).toBeEnabled();
```

- [ ] **Step 2: Run the added assertions and confirm failure**

Run: `pnpm test && pnpm test:e2e`

Expected: at least the new sample-data or polish assertions fail before implementation.

- [ ] **Step 3: Apply the visual system**

Use a restrained navy/slate workspace, warm off-white canvas, high-contrast white panels, indigo actions, and explicit green/amber/red risk tokens. Use a system font stack, 8 px spacing rhythm, 12–16 px radii, subtle borders instead of heavy shadows, visible `:focus-visible` rings, semantic tables, and mobile horizontal table scrolling. Do not load remote fonts or imagery.

```css
:root {
  color: #172033;
  background: #f5f3ee;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
}
:focus-visible { outline: 3px solid #6366f1; outline-offset: 3px; }
```

- [ ] **Step 4: Implement bundled sample loading and documentation**

The sample action fetches only bundled `/samples/*.csv` assets and creates local `File` objects. README sections are: Purpose, Privacy, Local setup, Commands, Static deployment, Synthetic sample flows, Risk rules, and MVP limitations. State explicitly that no Shopify connection or inventory write exists.

- [ ] **Step 5: Run the complete acceptance matrix**

Run:

```bash
pnpm test
pnpm test:e2e
pnpm lint:type
pnpm build
```

Expected: every command exits 0. Confirm manually from test names/output that clean is GREEN; duplicate, invalid/negative, mass-zero, and qualifying large-drop are RED; schema drift, non-mass new/missing, and unknown Shopify SKU are YELLOW; decisions persist; CSV/JSON blobs contain expected fields; and no code contains `fetch` except the bundled sample loader.

- [ ] **Step 6: Review privacy-sensitive code paths**

Run: `rg -n "fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|idb-keyval" src`

Expected: `fetch` appears only in the same-origin sample loader, browser storage appears only in `history.ts` through `idb-keyval`, and no upload-capable network API appears.

- [ ] **Step 7: Commit**

```bash
git add README.md src public
git commit -m "docs: prepare mvp for agency testing"
```
