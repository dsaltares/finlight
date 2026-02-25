import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import { decodeTextBuffer } from '@/lib/fileImport';
import { getLogger } from '@/server/logger';

const logger = getLogger('spreadsheet');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type SpreadsheetFormat = 'xlsx' | 'xls' | 'html-xls' | 'unknown';

function detectFormat(buffer: Buffer): SpreadsheetFormat {
  if (buffer.length < 4) return 'unknown';

  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'xlsx';
  }

  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return 'xls';
  }

  const head = buffer
    .subarray(0, 256)
    .toString('utf-8')
    .trimStart()
    .toLowerCase();
  if (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.startsWith('<table')
  ) {
    return 'html-xls';
  }

  return 'unknown';
}

function detectCharset(buffer: Buffer): string | null {
  const head = buffer.subarray(0, 1024).toString('ascii').toLowerCase();
  const match = head.match(/charset[= ]*([a-z0-9_-]+)/);
  return match?.[1] ?? null;
}

function parseHtmlTable(buffer: Buffer): string[][] {
  const charset = detectCharset(buffer);
  const html = charset
    ? new TextDecoder(charset).decode(buffer)
    : decodeTextBuffer(buffer);
  const $ = cheerio.load(html);
  const rows: string[][] = [];

  $('table tr').each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find('td')
      .each((_, td) => {
        cells.push($(td).text().trim());
      });
    rows.push(cells);
  });

  return rows.filter((row) => row.some((cell) => cell !== ''));
}

type ParseSpreadsheetArgs = {
  buffer: Buffer;
  fileName: string;
};

export function parseSpreadsheet({
  buffer,
  fileName,
}: ParseSpreadsheetArgs): string[][] {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds maximum allowed size of 10 MB');
  }

  const format = detectFormat(buffer);
  logger.info(
    { fileName, format, sizeBytes: buffer.length },
    'Parsing spreadsheet',
  );

  if (format === 'html-xls') {
    const rows = parseHtmlTable(buffer);
    logger.info(
      { fileName, format, rowCount: rows.length },
      'Spreadsheet parsed',
    );
    return rows;
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet contains no sheets');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    rawNumbers: false,
  });

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell !== ''));

  logger.info(
    { fileName, format, rowCount: nonEmptyRows.length },
    'Spreadsheet parsed',
  );

  return nonEmptyRows;
}

type StripEmptyColumnsResult = {
  rows: string[][];
  emptyColumns: number[];
  totalColumns: number;
};

export function stripEmptyColumnsForAi({
  rows,
}: {
  rows: string[][];
}): StripEmptyColumnsResult {
  if (rows.length === 0) {
    return { rows, emptyColumns: [], totalColumns: 0 };
  }

  const totalColumns = Math.max(...rows.map((row) => row.length));
  const emptyColumns: number[] = [];

  for (let col = 0; col < totalColumns; col++) {
    if (!rows.some((row) => row[col]?.trim())) {
      emptyColumns.push(col);
    }
  }

  if (emptyColumns.length === 0) {
    return { rows, emptyColumns, totalColumns };
  }

  const emptySet = new Set(emptyColumns);
  const strippedRows = rows.map((row) => {
    const next: string[] = [];
    for (let col = 0; col < totalColumns; col++) {
      if (!emptySet.has(col)) {
        next.push(row[col] ?? '');
      }
    }
    return next;
  });

  return { rows: strippedRows, emptyColumns, totalColumns };
}

export function rowsToCsv({ rows }: { rows: string[][] }): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const sanitized = cell.replace(/[\n\r]/g, ' ');
          return sanitized.includes(',') || sanitized.includes('"')
            ? `"${sanitized.replace(/"/g, '""')}"`
            : sanitized;
        })
        .join(','),
    )
    .join('\n');
}
