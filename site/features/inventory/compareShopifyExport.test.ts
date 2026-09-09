import { describe, expect, it } from 'vitest';

import { compareShopifySkus } from './compareShopifyExport';
import type { InventoryRow } from './types';

const row = (sku: string, rowNumber = 2): InventoryRow => ({
  rowNumber,
  sku,
  quantity: 1,
  rawSku: sku,
  rawQuantity: 1,
});

describe('Shopify export comparison', () => {
  it('reports supplier SKUs that are absent from Shopify', () => {
    expect(compareShopifySkus([row('SUP-2')], ['SUP-1'])).toContainEqual(
      expect.objectContaining({
        code: 'UNKNOWN_SHOPIFY_SKU',
        level: 'yellow',
        sku: 'SUP-2',
      }),
    );
  });

  it('reports each duplicated Shopify SKU once after trimming blanks', () => {
    const issues = compareShopifySkus([row('SUP-1')], [
      ' SUP-1 ',
      'SUP-1',
      '',
    ]);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_SHOPIFY_SKU',
        level: 'yellow',
        sku: 'SUP-1',
        affectedCount: 2,
      }),
    );
    expect(
      issues.filter((issue) => issue.code === 'DUPLICATE_SHOPIFY_SKU'),
    ).toHaveLength(1);
  });
});
