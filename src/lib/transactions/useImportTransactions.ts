import { type ChangeEventHandler, useCallback, useMemo, useRef } from 'react';
import { parse } from 'csv-parse/sync';
import parseDate from 'date-fns/parse';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import { TRPCClientError } from '@trpc/client';
import createUTCDate from '@lib/createUTCDate';
import Routes from '@lib/routes';
import type { Account } from '@server/account/types';
import useCreateTransactions from '@lib/transactions/useCreateTransactions';
import client from '../api';
import type {
  CSVImportField,
  CSVImportPreset,
} from '@server/csvImportPreset/types';

const useImportTransactions = (account: Account) => {
  const router = useRouter();
  const { mutateAsync: createTransactions, isLoading } = useCreateTransactions({
    onSuccess: (numTransactions: number) => {
      enqueueSnackbar({
        message: `Imported ${numTransactions} transactions.`,
        variant: 'success',
      });
    },
    onError: (e) => {
      const isBadlyFormedRequest =
        e instanceof TRPCClientError && e.data.cause === 'BAD_REQUEST';
      enqueueSnackbar({
        message: `Failed to import transactions.${
          isBadlyFormedRequest
            ? ' Either the import preset or the file are invalid.'
            : ''
        }`,
        variant: 'error',
      });
    },
  });
  const { data: presets } = client.getCSVImportPresets.useQuery();
  const { data: categories } = client.getCategories.useQuery();
  const preset = useMemo(
    () => presets?.find((preset) => preset.id === account.csvImportPresetId),
    [presets, account.csvImportPresetId],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileUploaded = useCallback(
    async (csv: string) => {
      if (!preset) {
        return;
      }

      try {
        const splitCSV = csv.split('\n');
        const joinedCSV = splitCSV
          .slice(preset.rowsToSkipStart, splitCSV.length - preset.rowsToSkipEnd)
          .join('\n');
        const records = parse(joinedCSV, {
          skip_empty_lines: false,
          delimiter: preset.delimiter || ',',
        }) as string[][];

        const dateIndex = preset.fields.indexOf('Date');
        const descriptionIndex = preset.fields.indexOf('Description');

        const transactions = records.map((record) => {
          const description = record[descriptionIndex] || '';
          const amount = parseNumericField(record, preset, 'Amount');
          const fee = parseNumericField(record, preset, 'Fee');
          const deposit = parseNumericField(record, preset, 'Deposit');
          const withdrawal = parseNumericField(record, preset, 'Withdrawal');
          const actualAmount = deposit || -Math.abs(withdrawal) || amount;

          return {
            date: parseDate(
              record[dateIndex],
              preset.dateFormat,
              createUTCDate(),
            ),
            description,
            amount: actualAmount - fee,
            categoryId:
              categories?.find((category) =>
                category.importPatterns.some((pattern) =>
                  description.toLowerCase().includes(pattern.toLowerCase()),
                ),
              )?.id || null,
          };
        });

        await createTransactions({
          accountId: account.id,
          transactions,
        });
        void router.push(Routes.transactionsForAccount(account.id));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    },
    [preset, categories, createTransactions, account.id, router],
  );
  const handleFileSelected: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      const reader = new FileReader();
      reader.onloadend = () => handleFileUploaded(reader.result as string);
      if (file) {
        reader.readAsText(file);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [handleFileUploaded],
  );

  return {
    fileInputRef,
    isLoading,
    handleUploadClick,
    handleFileSelected,
    canImport: !!preset,
  };
};

export default useImportTransactions;

const parseNumericField = (
  record: string[],
  preset: CSVImportPreset,
  fieldName: CSVImportField,
) => {
  const fieldIndex = preset.fields.indexOf(fieldName);
  let amountStr = fieldIndex > -1 ? record[fieldIndex] : '0';
  if (preset.decimal === '.') {
    amountStr = amountStr.replace(',', '');
  } else if (preset.decimal === ',') {
    amountStr = amountStr.replace('.', '').replace(',', '.');
  }
  return parseFloat(amountStr);
};
