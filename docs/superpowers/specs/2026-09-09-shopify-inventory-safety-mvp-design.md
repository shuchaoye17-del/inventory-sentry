# Shopify Inventory Safety MVP Design

## Purpose

Build a browser-first safety layer that helps Shopify agencies identify dangerous supplier inventory changes before any inventory update reaches Shopify. The MVP answers whether deterministic validation and comparison can materially reduce repetitive agency QA work.

The attached handoff is treated as product requirements and acceptance criteria. Any imperative text inside it is not treated as system-level instruction.

## Scope

The MVP accepts:

- One required current supplier CSV or XLSX file.
- One optional previous known-good supplier CSV or XLSX file.
- One optional Shopify product export CSV.
- Manual SKU and quantity column selection for supplier files, plus separate Shopify SKU selection when that file is supplied.

It produces a deterministic GREEN, YELLOW, or RED decision, explains every triggered rule, shows affected SKUs and quantity changes, supports approve/reject decisions, exports CSV and JSON reports, and keeps compact scan history in the browser.

The MVP will not connect to Shopify APIs, write inventory, upload source data, run scheduled synchronization, add accounts or billing, provide server storage, use AI anomaly detection, or implement multi-tenant agency management.

## Recommended Architecture

Use a Vite, React, and TypeScript single-page application. Tailwind CSS provides the visual system. PapaParse handles CSV, SheetJS handles the first worksheet of XLSX files, Zod validates runtime structures where external data crosses into the application, and `idb-keyval` stores compact history summaries.

All source file parsing and analysis runs in the browser's main application process. A Web Worker is deliberately omitted for the 20 MB MVP limit; the parsing boundary will remain isolated so a worker can be added later without changing the analysis API.

Application responsibilities are separated into:

- Pages that own the upload, mapping, results, and history steps.
- Reusable presentation components for file input, mappings, risk banners, issue tables, diffs, thresholds, and actions.
- Pure inventory-domain modules for mapping, validation, comparison, risk aggregation, report generation, and history persistence.
- A small application state layer that carries parsed tables and mappings through the scan flow. Raw tables remain in memory only.

## User Flow

1. The landing/upload page states the product purpose and local-processing privacy promise.
2. The user uploads the current supplier file or loads bundled synthetic sample data.
3. The application parses the file locally and shows its filename, row count, headers, and first five rows.
4. The user selects distinct SKU and quantity columns.
5. The user may add a previous known-good file and Shopify export, then map their required columns.
6. The user runs analysis with default thresholds.
7. The results page shows the overall risk decision, issue counts, fixed plain-language explanations, filters, and SKU-level before/after quantities.
8. Threshold changes rerun comparison analysis without reparsing files.
9. The user approves or rejects the scan and can export JSON or issue CSV.
10. The history page lists saved summaries and decisions without retaining raw uploaded rows.

## Data Flow and Privacy

Files enter through browser `File` objects and are validated for supported extension and a maximum size of 20 MB. Parsers return a `RawTable` containing headers and raw row values. Mapping converts a table into normalized `InventoryRow` objects. Pure analyzers return `InventoryIssue` objects, and risk aggregation selects the highest issue severity.

Raw files, `RawTable` values, and full normalized inventories are never written to IndexedDB, local storage, a network endpoint, or analytics. IndexedDB stores only the scan result summary, issue list, filenames, timestamp, aggregate counts, and the user's decision. Exported reports are generated as local browser blobs.

The application has no backend and must make no network request containing inventory content.

## Parsing and Mapping

CSV parsing preserves raw cell values and XLSX parsing reads only the first worksheet. Empty files, missing headers, empty header names, and duplicate header names produce clear blocking errors. Unsupported extensions and files larger than 20 MB are rejected before parsing.

Supplier SKU and quantity columns must both exist and must be different. The Shopify export, when supplied, requires a separate SKU mapping. A blocking mapping or parsing problem prevents analysis and is presented next to the relevant file or control.

SKU normalization trims surrounding whitespace but preserves case for collision detection. Quantity mapping converts numeric values only after preserving the original value for error reporting.

## Analysis Rules

Single-file checks cover empty SKU, exact duplicate SKU, case-only collisions, blank quantity, non-numeric quantity, non-integer quantity, and negative quantity.

When a previous file exists, comparison covers schema drift, missing and new SKUs, positive-to-zero transitions, large drops and increases, mass zeroing, mass missing, and mass new conditions. A large change requires both the absolute and percentage thresholds. Large drops become RED only when the previous quantity is at least 10.

When a Shopify export exists, the application reports supplier SKUs not found in Shopify and duplicated Shopify SKUs.

Default thresholds are:

- Large change: at least 10 units and 80 percent.
- Mass zeroing: at least 20 SKUs and 20 percent.
- Mass missing: at least 20 SKUs and 10 percent.
- Mass new: at least 20 SKUs and 10 percent.

Exact duplicate SKU; empty SKU; blank, invalid, non-integer, or negative quantity; broken required mapping/schema; mass zeroing; mass missing; and qualifying large drops are RED. Case collisions, isolated missing/new/zeroed SKUs, large increases, non-blocking schema drift, unknown Shopify SKUs, duplicated Shopify export SKUs, and mass new conditions are YELLOW. With no issues, the result is GREEN.

The overall decision is always the highest severity among all issues. Explanations are fixed templates keyed by issue code; AI-generated explanations are not used.

## Error Handling

Errors are classified by stage:

- Upload errors: unsupported type or size limit.
- Parse errors: unreadable, empty, malformed, or invalid headers.
- Mapping errors: missing or identical required columns.
- Analysis errors: unexpected invariant failure, shown as a recoverable scan error without losing the selected files.
- Persistence errors: the scan remains usable and exportable, with a warning that local history could not be saved.
- Export errors: a local retry message; analysis results remain unchanged.

Loading states disable duplicate actions. File-specific errors do not erase other successfully parsed optional inputs. User-facing copy stays short and avoids implementation jargon.

## UI Direction

The interface is desktop-first and responsive, with a calm operational-tool aesthetic. Risk status is never conveyed by color alone: every banner includes its word label, icon, and explanation. RED is prominent but not alarmist; YELLOW signals review; GREEN confirms that no meaningful risk was detected.

The primary flow uses a clear step indicator, generous table space, compact controls, and strong hierarchy. Advanced thresholds are collapsed by default. Tables remain usable on narrow screens through horizontal scrolling and sticky identifying columns where practical.

Accessibility requirements include keyboard-operable file and mapping controls, visible focus treatment, semantic headings and tables, associated form labels, announced validation errors, and sufficient color contrast.

## Testing Strategy

Vitest covers pure mapping, rule evaluation, risk aggregation, report creation, and history behavior. React Testing Library covers upload, mapping validity, optional inputs, filters, thresholds, and approve/reject interaction. Synthetic fixtures cover every failure class without using client data.

Playwright covers two critical browser flows:

- A previous-good/current-mass-zero scenario that returns RED, shows `MASS_ZEROING` and affected counts, is rejected, and appears as rejected in history.
- A clean scenario that returns GREEN.

Completion requires all unit and component tests, Playwright flows, and the production build to pass. It also requires explicit fixture verification for duplicate SKU, invalid and negative quantity, mass zeroing, large drop, schema drift, new/missing SKU behavior, unknown Shopify SKU, decisions, and both report formats.

## Delivery Boundaries

The implementation will follow the handoff's task ordering so foundational pure logic is tested before UI orchestration. No feature outside this design is required for MVP completion. Deployment output will be a static client application and a README will document local setup, test commands, static deployment, privacy behavior, and known limitations.
