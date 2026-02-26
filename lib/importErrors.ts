export const ImportErrorTypes = [
  'invalid_date',
  'invalid_amount',
  'missing_required_field',
  'wrong_column_count',
] as const;

export type ImportErrorType = (typeof ImportErrorTypes)[number];

export type ImportParseError = {
  row: number;
  column: string | null;
  value: string;
  type: ImportErrorType;
};

const MaxErrors = 50;

export function parseImportErrors(message: string): ImportParseError[] | null {
  try {
    const parsed = JSON.parse(message);
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed[0].type ||
      !parsed[0].row
    ) {
      return null;
    }
    return parsed as ImportParseError[];
  } catch {
    return null;
  }
}

export function formatImportErrorMessage(error: ImportParseError): string {
  switch (error.type) {
    case 'invalid_date':
      return `Failed to parse date "${error.value}"`;
    case 'invalid_amount':
      return `Invalid amount "${error.value}"`;
    case 'missing_required_field':
      return `Missing required field ${error.column}`;
    case 'wrong_column_count':
      return `Expected ${error.column} columns, got ${error.value}`;
  }
}

export function serializeImportErrors(errors: ImportParseError[]): string {
  return JSON.stringify(errors.slice(0, MaxErrors));
}
