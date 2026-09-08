# Inventory Sentry MVP

## Purpose

Inventory Sentry is a browser-first preflight check for supplier inventory files. It helps an operator map SKU and quantity columns, compare a current feed with an optional known-good feed and Shopify export, review deterministic risk findings, and make an explicit approve-or-reject decision before any separate inventory update process.

## Privacy

All CSV and XLSX parsing, mapping, comparison, and report generation happens in the browser. Raw files and raw rows are not uploaded or persisted. IndexedDB stores only compact scan summaries, issue metadata, and the operator's decision. The only runtime `fetch` loads the bundled synthetic sample at `/samples/clean-current.csv` from the same site.

This MVP has no Shopify API connection and cannot write inventory. It has no backend data store, accounts, authentication, billing, or telemetry.

## Local setup

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Commands

```bash
pnpm dev        # local development server
pnpm test       # unit and component tests
pnpm test:e2e   # critical Chrome journeys
pnpm lint:type  # lint and TypeScript checks
pnpm build      # production build
```

## Static deployment

Run `pnpm build` and deploy the generated Sites/Vinext output through the configured Sites hosting workflow. No secrets or environment variables are required for the MVP. The production host serves application assets and bundled samples only; inventory processing remains in the browser.

## Synthetic sample flows

- Choose **Try sample inventory instead** for a current-only GREEN check.
- Use `public/samples/previous-good.csv` as the previous file and `public/samples/mass-zero-current.csv` as the current file to exercise the RED mass-zero protection.
- Test fixtures under `tests/fixtures` cover duplicate SKUs, invalid quantities, schema drift, unknown Shopify SKUs, and comparison thresholds.

All included data is synthetic.

## Risk rules

- **RED**: duplicate SKU, missing or invalid quantity, negative quantity, mass zeroing, or a qualifying large drop.
- **YELLOW**: schema drift, smaller sets of new or missing SKUs, or supplier SKUs absent from an optional Shopify export.
- **GREEN**: no meaningful risk detected by the enabled checks.

Thresholds for aggregate and per-SKU change rules can be adjusted on the results page and rerun against the in-memory data.

## MVP limitations

- No Shopify API read or write access.
- No automatic inventory update, rollback, scheduling, or background jobs.
- No server-side file processing, multi-user collaboration, or cloud history.
- No account system, billing, or agency workspace management.
- Decisions are advisory records; a human still controls any downstream Shopify action outside this app.
