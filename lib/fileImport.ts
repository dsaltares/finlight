const SPREADSHEET_EXTENSIONS = new Set(['.xls', '.xlsx']);

export const IMPORT_ACCEPT =
  '.csv,.xls,.xlsx,.pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf';

export function isSpreadsheetFile(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return SPREADSHEET_EXTENSIONS.has(ext);
}

export function isPdfFile(fileName: string): boolean {
  return fileName.slice(fileName.lastIndexOf('.')).toLowerCase() === '.pdf';
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
