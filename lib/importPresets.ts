import z from 'zod';

export const CSVImportFields = [
  'Date',
  'Amount',
  'Withdrawal',
  'Deposit',
  'Fee',
  'Description',
  'Ignore',
] as const;

export type CSVImportField = (typeof CSVImportFields)[number];

export const CsvImportFieldSchema = z.enum(CSVImportFields);

export const ImportPresetConfigSchema = z.object({
  fields: z.array(CsvImportFieldSchema),
  dateFormat: z.string(),
  delimiter: z.string(),
  decimal: z.string(),
  rowsToSkipStart: z.number(),
  rowsToSkipEnd: z.number(),
});

export type ImportPresetConfig = z.infer<typeof ImportPresetConfigSchema>;
