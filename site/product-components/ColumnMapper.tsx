'use client';

export type ColumnMapping = {
  skuColumn: string;
  quantityColumn: string;
};

type ColumnMapperProps = {
  headers: string[];
  labelPrefix: string;
  value: ColumnMapping;
  onChange: (value: ColumnMapping) => void;
};

export const isValidMapping = (
  headers: string[],
  value: ColumnMapping,
) =>
  headers.includes(value.skuColumn) &&
  headers.includes(value.quantityColumn) &&
  value.skuColumn !== value.quantityColumn;

export function ColumnMapper({
  headers,
  labelPrefix,
  value,
  onChange,
}: ColumnMapperProps) {
  const sameColumn =
    value.skuColumn !== '' &&
    value.quantityColumn !== '' &&
    value.skuColumn === value.quantityColumn;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">
        {labelPrefix} SKU column
        <select
          className="h-11 rounded-lg border border-input bg-card px-3 text-sm font-normal shadow-sm focus:border-ring"
          aria-label={`${labelPrefix} SKU column`}
          value={value.skuColumn}
          onChange={(event) =>
            onChange({ ...value, skuColumn: event.currentTarget.value })
          }
        >
          <option value="">Choose a column</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {labelPrefix} quantity column
        <select
          className="h-11 rounded-lg border border-input bg-card px-3 text-sm font-normal shadow-sm focus:border-ring"
          aria-label={`${labelPrefix} quantity column`}
          value={value.quantityColumn}
          onChange={(event) =>
            onChange({ ...value, quantityColumn: event.currentTarget.value })
          }
        >
          <option value="">Choose a column</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </label>
      {sameColumn ? (
        <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">
          SKU and quantity columns must be different.
        </p>
      ) : null}
    </div>
  );
}
