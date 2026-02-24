import { useMutation, useQuery } from '@tanstack/react-query';
import { format as formatDate } from 'date-fns/format';
import { parse as parseDate } from 'date-fns/parse';
import Papa from 'papaparse';
import { type ChangeEventHandler, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  arrayBufferToBase64,
  isPdfFile,
  isSpreadsheetFile,
} from '@/lib/fileImport';
import type { CSVImportField } from '@/lib/importPresets';
import { type RouterOutput, useTRPC } from '@/lib/trpc';
import type { CSVImportPreset } from '@/server/trpc/procedures/importPresets';

type Account = RouterOutput['accounts']['list']['accounts'][number];
type Category = RouterOutput['categories']['list'][number];

type HandleFileUploadedArgs = {
  buffer: ArrayBuffer;
  fileName: string;
};

type MapRecordsArgs = {
  records: string[][];
  preset: CSVImportPreset;
  categories: Category[] | undefined;
};

export default function useImportTransactions(account: Account) {
  const trpc = useTRPC();
  const { mutateAsync: createTransactions, isPending } = useMutation(
    trpc.transactions.createMany.mutationOptions({
      onSuccess: (count: number) => {
        toast.success(`Imported ${count} transactions.`);
      },
      onError: (e) => {
        toast.error(`Failed to import transactions. ${e.message}`);
      },
    }),
  );
  const { mutateAsync: parseSpreadsheetMutation } = useMutation(
    trpc.importPresets.parseSpreadsheet.mutationOptions(),
  );
  const { mutateAsync: parsePdfMutation } = useMutation(
    trpc.importPresets.parsePdf.mutationOptions(),
  );
  const { data: presets } = useQuery(trpc.importPresets.list.queryOptions());
  const { data: categories } = useQuery(trpc.categories.list.queryOptions());
  const preset = useMemo(
    () => presets?.find((p) => p.id === account.csvImportPresetId),
    [presets, account.csvImportPresetId],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileUploaded = useCallback(
    async ({ buffer, fileName }: HandleFileUploadedArgs) => {
      try {
        let transactions: {
          date: string;
          description: string;
          amount: number;
          categoryId: number | null;
        }[];

        if (isPdfFile(fileName)) {
          const fileBase64 = arrayBufferToBase64(buffer);
          const parsed = await parsePdfMutation({
            fileBase64,
            currency: account.currency,
          });
          transactions = parsed.map((t) => ({
            ...t,
            categoryId: matchCategoryByPattern(t.description, categories),
          }));
        } else {
          if (!preset) {
            toast.error('No import preset configured for this account.');
            return;
          }

          let records: string[][];

          if (isSpreadsheetFile(fileName)) {
            const fileBase64 = arrayBufferToBase64(buffer);
            const allRows = await parseSpreadsheetMutation({
              fileBase64,
              fileName,
            });
            const endSlice =
              preset.rowsToSkipEnd > 0
                ? allRows.length - preset.rowsToSkipEnd
                : allRows.length;
            records = allRows.slice(preset.rowsToSkipStart, endSlice);
          } else {
            const csv = new TextDecoder('utf-8').decode(buffer);
            const lines = csv.split('\n');
            const trimmed = lines
              .slice(
                preset.rowsToSkipStart,
                lines.length - preset.rowsToSkipEnd,
              )
              .join('\n');
            const { data } = Papa.parse<string[]>(trimmed, {
              delimiter: preset.delimiter || ',',
              skipEmptyLines: true,
            });
            records = data;
          }

          transactions = mapRecordsToTransactions({
            records,
            preset,
            categories,
          });
        }

        await createTransactions({
          accountId: account.id,
          transactions,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to import transactions. ${message}`);
      }
    },
    [
      preset,
      categories,
      createTransactions,
      parsePdfMutation,
      account.id,
      account.currency,
      parseSpreadsheetMutation,
    ],
  );

  const handleFileSelected: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        void handleFileUploaded({
          buffer: reader.result as ArrayBuffer,
          fileName: file.name,
        });
      };
      reader.readAsArrayBuffer(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUploaded],
  );

  return {
    fileInputRef,
    isPending,
    handleUploadClick,
    handleFileSelected,
    canImport: true,
  };
}

function mapRecordsToTransactions({
  records,
  preset,
  categories,
}: MapRecordsArgs) {
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
      amount: actualAmount - fee,
      categoryId: matchCategoryByPattern(description, categories),
    };
  });
}

function parseNumericField(
  record: string[],
  preset: CSVImportPreset,
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
  categories: Category[] | undefined,
): number | null {
  const lower = description.toLowerCase();
  return (
    categories?.find((category) =>
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
