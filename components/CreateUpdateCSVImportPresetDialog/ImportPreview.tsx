'use client';

import { useMutation } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import Papa from 'papaparse';
import {
  type ChangeEventHandler,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  arrayBufferToBase64,
  IMPORT_ACCEPT,
  isSpreadsheetFile,
} from '@/lib/fileImport';
import { useTRPC } from '@/lib/trpc';
import type { CSVImportPresetFormValues } from './types';

type PreviewType = 'import' | 'raw';

type Props = {
  watch: UseFormWatch<CSVImportPresetFormValues>;
};

export default function ImportPreview({ watch }: Props) {
  const [delimiter, fields, rowsToSkipStart, rowsToSkipEnd] = watch([
    'delimiter',
    'fields',
    'rowsToSkipStart',
    'rowsToSkipEnd',
  ]);
  const [csvText, setCsvText] = useState('');
  const [spreadsheetRows, setSpreadsheetRows] = useState<string[][]>([]);
  const [previewType, setPreviewType] = useState<PreviewType>('import');
  const ref = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();
  const { mutateAsync: parseSpreadsheet } = useMutation(
    trpc.importPresets.parseSpreadsheet.mutationOptions(),
  );

  const handleUploadClick = () => {
    ref.current?.click();
  };

  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const buffer = await file.arrayBuffer();

      if (isSpreadsheetFile(file.name)) {
        const fileBase64 = arrayBufferToBase64(buffer);
        const rows = await parseSpreadsheet({
          fileBase64,
          fileName: file.name,
        });
        setSpreadsheetRows(rows);
        setCsvText(rows.map((row) => row.join('\t')).join('\n'));
      } else {
        const text = new TextDecoder('utf-8').decode(buffer);
        setCsvText(text);
        setSpreadsheetRows([]);
      }
    },
    [parseSpreadsheet],
  );

  const isSpreadsheet = spreadsheetRows.length > 0;

  const { headers, rows } = useMemo(() => {
    if (!csvText && !isSpreadsheet) {
      return { headers: [] as string[], rows: [] as string[][] };
    }

    try {
      const start = Number.parseInt(rowsToSkipStart, 10) || 0;
      const end = Number.parseInt(rowsToSkipEnd, 10) || 0;

      let records: string[][];

      if (isSpreadsheet) {
        const endSlice =
          end > 0 ? spreadsheetRows.length - end : spreadsheetRows.length;
        records = spreadsheetRows.slice(start, endSlice);
      } else {
        const lines = csvText.split('\n');
        const trimmed = lines.slice(start, lines.length - end).join('\n');
        const { data } = Papa.parse<string[]>(trimmed, {
          delimiter: delimiter || ',',
          skipEmptyLines: true,
        });
        records = data;
      }

      const numColumns = records[0]?.length ?? 0;
      const extraHeaders =
        fields.length < numColumns
          ? Array.from({ length: numColumns - fields.length }, () => 'Unknown')
          : [];

      return {
        headers: ['#', ...fields.map((field) => field.value), ...extraHeaders],
        rows: records,
      };
    } catch {
      return { headers: [] as string[], rows: [] as string[][] };
    }
  }, [
    csvText,
    delimiter,
    fields,
    rowsToSkipStart,
    rowsToSkipEnd,
    isSpreadsheet,
    spreadsheetRows,
  ]);

  const headerEntries = useMemo(() => withStableKeys(headers), [headers]);
  const rowEntries = useMemo(() => withStableKeys(rows), [rows]);

  const rawCSVText = useMemo(
    () => csvText.split('\n').filter(Boolean).join('\n'),
    [csvText],
  );

  const handlePreviewTypeChange = (
    _event: MouseEvent<HTMLButtonElement>,
    nextPreviewType: PreviewType,
  ) => {
    setPreviewType(nextPreviewType);
  };

  return (
    <Card className="min-w-0 gap-2 overflow-x-hidden p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">Preview</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={previewType === 'import' ? 'default' : 'outline'}
              onClick={(event) => handlePreviewTypeChange(event, 'import')}
            >
              Import
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewType === 'raw' ? 'default' : 'outline'}
              onClick={(event) => handlePreviewTypeChange(event, 'raw')}
            >
              Raw
            </Button>
          </div>
          <Button type="button" size="sm" onClick={handleUploadClick}>
            <FileUp className="size-4" />
            Choose file
            <input
              ref={ref}
              hidden
              type="file"
              accept={IMPORT_ACCEPT}
              onChange={handleFileUpload}
            />
          </Button>
        </div>
      </div>

      {previewType === 'import' ? (
        headers.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  {headerEntries.map((header) => (
                    <TableHead key={header.key}>{header.value}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowEntries.map((row, rowIndex) => (
                  <TableRow key={row.key}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {withStableKeys(row.value).map((cell) => (
                      <TableCell key={`${row.key}-${cell.key}`}>
                        {cell.value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Upload a file to preview.
          </p>
        )
      ) : (
        <Textarea readOnly value={rawCSVText} className="min-h-48 font-mono" />
      )}
    </Card>
  );
}

function withStableKeys<T>(values: T[]) {
  const counts = new Map<string, number>();
  return values.map((value) => {
    const base = String(value);
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return {
      key: `${base}-${count}`,
      value,
    };
  });
}
