import { format as formatDate } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse as parseDate } from 'date-fns/parse';
import Papa from 'papaparse';
import type { ImportParseError } from '@/lib/importErrors';
import { serializeImportErrors } from '@/lib/importErrors';
import { decodeTextBuffer } from '@/lib/fileImport';
import type { CSVImportField, ImportPresetConfig } from '@/lib/importPresets';
import { generateImportPreset, parsePdfTransactions } from '@/server/ai';
import { getLogger } from '@/server/logger';
import {
  parseSpreadsheet,
  rowsToCsv,
  stripEmptyColumnsForAi,
} from '@/server/spreadsheet';

const logger = getLogger('importFile');

export class ImportValidationError extends Error {
  errors: ImportParseError[];
  constructor(errors: ImportParseError[]) {
    super(serializeImportErrors(errors));
    this.name = 'ImportValidationError';
    this.errors = errors;
  }
}

const SpreadsheetExtensions = new Set(['.xls', '.xlsx']);

function isSpreadsheetFile(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return SpreadsheetExtensions.has(ext);
}

function isPdfFile(fileName: string): boolean {
  return fileName.slice(fileName.lastIndexOf('.')).toLowerCase() === '.pdf';
}

type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  categoryId: number | null;
};

type Category = {
  id: number;
  name: string;
  importPatterns: string[];
};

type ImportFileArgs = {
  userId: string;
  fileBase64: string;
  fileName: string;
  currency: string;
  preset: ImportPresetConfig | null;
  categories: Category[];
};

export async function importFile({
  userId,
  fileBase64,
  fileName,
  currency,
  preset,
  categories,
}: ImportFileArgs): Promise<ParsedTransaction[]> {
  if (isPdfFile(fileName)) {
    const parsed = await parsePdfTransactions({
      userId,
      fileBase64,
      currency,
    });
    return parsed.map((t) => ({
      ...t,
      amount: Math.round(t.amount * 100),
      categoryId: matchCategoryByPattern(t.description, categories),
    }));
  }

  const buffer = Buffer.from(fileBase64, 'base64');
  const activePreset =
    preset ?? (await resolvePreset({ userId, buffer, fileName }));

  logger.info(
    { fileName, hasPreset: !!preset, fields: activePreset.fields },
    'Importing file with preset',
  );

  const records = parseRecords({ buffer, fileName, preset: activePreset });
  return mapRecordsToTransactions({
    records,
    preset: activePreset,
    categories,
  });
}

type ResolvePresetArgs = {
  userId: string;
  buffer: Buffer;
  fileName: string;
};

async function resolvePreset({
  userId,
  buffer,
  fileName,
}: ResolvePresetArgs): Promise<ImportPresetConfig> {
  let csvContent: string;
  let emptyColumns: number[] = [];
  let totalColumns = 0;

  if (isSpreadsheetFile(fileName)) {
    const rows = parseSpreadsheet({ buffer, fileName });
    const stripped = stripEmptyColumnsForAi({ rows });
    csvContent = rowsToCsv({ rows: stripped.rows });
    emptyColumns = stripped.emptyColumns;
    totalColumns = stripped.totalColumns;
  } else {
    csvContent = decodeTextBuffer(buffer);
  }

  const preset = await generateImportPreset({ userId, csvContent });

  if (emptyColumns.length === 0) {
    return preset;
  }

  return {
    ...preset,
    fields: expandFieldsWithEmptyColumns({
      fields: preset.fields,
      emptyColumns,
      totalColumns,
    }),
  };
}

type ParseRecordsArgs = {
  buffer: Buffer;
  fileName: string;
  preset: ImportPresetConfig;
};

function parseRecords({
  buffer,
  fileName,
  preset,
}: ParseRecordsArgs): string[][] {
  if (isSpreadsheetFile(fileName)) {
    const allRows = parseSpreadsheet({ buffer, fileName });
    const endSlice =
      preset.rowsToSkipEnd > 0
        ? allRows.length - preset.rowsToSkipEnd
        : allRows.length;
    return allRows.slice(preset.rowsToSkipStart, endSlice);
  }

  const csv = decodeTextBuffer(buffer);
  const lines = csv.split('\n');
  const trimmed = lines
    .slice(preset.rowsToSkipStart, lines.length - preset.rowsToSkipEnd)
    .join('\n');
  const { data } = Papa.parse<string[]>(trimmed, {
    delimiter: preset.delimiter || ',',
    skipEmptyLines: true,
  });
  return data;
}

type ExpandFieldsArgs = {
  fields: CSVImportField[];
  emptyColumns: number[];
  totalColumns: number;
};

function expandFieldsWithEmptyColumns({
  fields,
  emptyColumns,
  totalColumns,
}: ExpandFieldsArgs): CSVImportField[] {
  if (emptyColumns.length === 0) return fields;

  const nonEmptyColumns = totalColumns - emptyColumns.length;
  if (fields.length !== nonEmptyColumns) return fields;

  const emptySet = new Set(emptyColumns);
  const expanded: CSVImportField[] = [];
  let fieldIndex = 0;

  for (let col = 0; col < totalColumns; col++) {
    if (emptySet.has(col)) {
      expanded.push('Ignore');
    } else {
      expanded.push(fields[fieldIndex] ?? 'Ignore');
      fieldIndex += 1;
    }
  }

  return expanded;
}

type MapRecordsArgs = {
  records: string[][];
  preset: ImportPresetConfig;
  categories: Category[];
};

function mapRecordsToTransactions({
  records,
  preset,
  categories,
}: MapRecordsArgs): ParsedTransaction[] {
  const dateIndex = preset.fields.indexOf('Date');
  const descriptionIndex = preset.fields.indexOf('Description');
  const expectedColumns = preset.fields.length;
  const errors: ImportParseError[] = [];
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const row = i + 1 + preset.rowsToSkipStart;

    if (record.length !== expectedColumns) {
      errors.push({
        row,
        column: String(expectedColumns),
        value: String(record.length),
        type: 'wrong_column_count',
      });
      continue;
    }

    const rowErrors = validateRecord({
      record,
      row,
      preset,
      dateIndex,
      descriptionIndex,
    });
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    const description = record[descriptionIndex] || '';
    const amount = parseNumericField(record, preset, 'Amount');
    const fee = parseNumericField(record, preset, 'Fee');
    const deposit = parseNumericField(record, preset, 'Deposit');
    const withdrawal = parseNumericField(record, preset, 'Withdrawal');
    const actualAmount = deposit || -Math.abs(withdrawal) || amount;

    transactions.push({
      date: formatDateISO(record[dateIndex], preset.dateFormat),
      description,
      amount: Math.round((actualAmount - fee) * 100),
      categoryId: matchCategoryByPattern(description, categories),
    });
  }

  if (errors.length > 0) {
    throw new ImportValidationError(errors);
  }

  return transactions;
}

type ValidateRecordArgs = {
  record: string[];
  row: number;
  preset: ImportPresetConfig;
  dateIndex: number;
  descriptionIndex: number;
};

function validateRecord({
  record,
  row,
  preset,
  dateIndex,
  descriptionIndex,
}: ValidateRecordArgs): ImportParseError[] {
  const errors: ImportParseError[] = [];

  if (dateIndex >= 0) {
    const dateStr = record[dateIndex]?.trim();
    if (!dateStr) {
      errors.push({
        row,
        column: 'Date',
        value: '',
        type: 'missing_required_field',
      });
    } else if (!isValidDate(dateStr, preset.dateFormat)) {
      errors.push({
        row,
        column: 'Date',
        value: dateStr,
        type: 'invalid_date',
      });
    }
  }

  if (descriptionIndex >= 0) {
    const description = record[descriptionIndex]?.trim();
    if (!description) {
      errors.push({
        row,
        column: 'Description',
        value: '',
        type: 'missing_required_field',
      });
    }
  }

  for (const fieldName of AmountFields) {
    const fieldIndex = preset.fields.indexOf(fieldName);
    if (fieldIndex < 0) continue;
    const raw = record[fieldIndex]?.trim();
    if (!raw) continue;
    const value = parseNumericField(record, preset, fieldName);
    if (Number.isNaN(value)) {
      errors.push({
        row,
        column: fieldName,
        value: raw,
        type: 'invalid_amount',
      });
    }
  }

  return errors;
}

const AmountFields: CSVImportField[] = [
  'Amount',
  'Fee',
  'Deposit',
  'Withdrawal',
];

function isValidDate(dateStr: string, dateFormat: string): boolean {
  const now = new Date();
  const utcNow = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const parsed = parseDate(dateStr, dateFormat, utcNow);
  return isValid(parsed);
}

function parseNumericField(
  record: string[],
  preset: ImportPresetConfig,
  fieldName: CSVImportField,
) {
  const fieldIndex = preset.fields.indexOf(fieldName);
  let str = fieldIndex > -1 ? record[fieldIndex] : '0';
  if (preset.decimal === '.') {
    str = str.replace(',', '');
  } else if (preset.decimal === ',') {
    str = str.replace('.', '').replace(',', '.');
  }
  return Number.parseFloat(str);
}

function matchCategoryByPattern(
  description: string,
  categories: Category[],
): number | null {
  const lower = description.toLowerCase();
  return (
    categories.find((category) =>
      category.importPatterns.some((pattern) =>
        lower.includes(pattern.toLowerCase()),
      ),
    )?.id ?? null
  );
}

function formatDateISO(dateStr: string, dateFormat: string) {
  const now = new Date();
  const utcNow = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const parsed = parseDate(dateStr, dateFormat, utcNow);
  return formatDate(parsed, 'yyyy-MM-dd');
}
