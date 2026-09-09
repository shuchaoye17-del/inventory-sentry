import type { InventoryRow, RawTable } from './types';

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const toCellText = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  return '';
};

const toQuantity = (value: unknown): number | null => {
  if (isBlank(value)) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : null;
};

export function mapInventoryRows(
  table: RawTable,
  skuColumn: string,
  quantityColumn: string,
): InventoryRow[] {
  const validSkuColumn = table.headers.includes(skuColumn);
  const validQuantityColumn = table.headers.includes(quantityColumn);
  if (!validSkuColumn || !validQuantityColumn) {
    throw new Error('Choose valid SKU and quantity columns.');
  }
  if (skuColumn === quantityColumn) {
    throw new Error('SKU and quantity columns must be different.');
  }

  return table.rows.map((record, index) => {
    const rawSku = record[skuColumn];
    const rawQuantity = record[quantityColumn];
    return {
      rowNumber: index + 2,
      sku: toCellText(rawSku),
      quantity: toQuantity(rawQuantity),
      rawSku,
      rawQuantity,
    };
  });
}
