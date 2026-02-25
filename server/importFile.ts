import { format as formatDate } from 'date-fns/format';
import { parse as parseDate } from 'date-fns/parse';
import Papa from 'papaparse';
import type { CSVImportField, ImportPresetConfig } from '@/lib/importPresets';
import { generateImportPreset, parsePdfTransactions } from '@/server/ai';
import { getLogger } from '@/server/logger';
import { parseSpreadsheet } from '@/server/spreadsheet';

const logger = getLogger('importFile');

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

  if (isSpreadsheetFile(fileName)) {
    const rows = parseSpreadsheet({ buffer, fileName });
    csvContent = rowsToCsv(rows);
  } else {
    csvContent = buffer.toString('utf-8');
  }

  return generateImportPreset({ userId, csvContent });
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

  const csv = buffer.toString('utf-8');
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

function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          cell.includes(',') || cell.includes('"') || cell.includes('\n')
            ? `"${cell.replace(/"/g, '""')}"`
            : cell,
        )
        .join(','),
    )
    .join('\n');
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

  return records.map((record) => {
    const description = record[descriptionIndex] || '';
    const amount = parseNumericField(record, preset, 'Amount');
    const fee = parseNumericField(record, preset, 'Fee');
    const deposit = parseNumericField(record, preset, 'Deposit');
    const withdrawal = parseNumericField(record, preset, 'Withdrawal');
    const actualAmount = deposit || -Math.abs(withdrawal) || amount;

    return {
      date: formatDateISO(record[dateIndex], preset.dateFormat),
      description,
      amount: Math.round((actualAmount - fee) * 100),
      categoryId: matchCategoryByPattern(description, categories),
    };
  });
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
