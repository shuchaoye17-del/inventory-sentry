import type { InventoryIssue, InventoryRow } from './types';

export function compareShopifySkus(
  currentRows: InventoryRow[],
  shopifySkus: string[],
): InventoryIssue[] {
  const normalized = shopifySkus.map((sku) => sku.trim()).filter(Boolean);
  const counts = new Map<string, number>();
  for (const sku of normalized) {
    counts.set(sku, (counts.get(sku) ?? 0) + 1);
  }

  const issues: InventoryIssue[] = [];
  for (const [sku, count] of counts) {
    if (count < 2) continue;
    issues.push({
      code: 'DUPLICATE_SHOPIFY_SKU',
      level: 'yellow',
      sku,
      affectedCount: count,
      message: `${sku} appears ${count} times in the Shopify export.`,
    });
  }

  const available = new Set(normalized);
  const reported = new Set<string>();
  for (const row of currentRows) {
    if (!row.sku || available.has(row.sku) || reported.has(row.sku)) continue;
    reported.add(row.sku);
    issues.push({
      code: 'UNKNOWN_SHOPIFY_SKU',
      level: 'yellow',
      sku: row.sku,
      rowNumber: row.rowNumber,
      currentQuantity: row.quantity ?? undefined,
      message: `${row.sku} was not found in the Shopify export.`,
    });
  }

  return issues;
}
