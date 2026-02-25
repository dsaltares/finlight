import type { CSVImportField } from '@/lib/importPresets';

export type CSVImportPresetFormValues = {
  name: string;
  fields: { id: CSVImportField; value: CSVImportField }[];
  dateFormat: string;
  delimiter: string;
  decimal: string;
  rowsToSkipStart: string;
  rowsToSkipEnd: string;
};

export type FileData = {
  csvText: string;
  spreadsheetRows: string[][];
};
