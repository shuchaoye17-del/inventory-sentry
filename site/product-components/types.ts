import type { RawTable } from '@/features/inventory/types';

export type UploadedTable = {
  fileName: string;
  table: RawTable;
};
