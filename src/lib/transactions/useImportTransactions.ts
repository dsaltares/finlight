import { type ChangeEventHandler, useCallback, useMemo, useRef } from 'react';
import { parse } from 'csv-parse/sync';
import parseDate from 'date-fns/parse';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import { TRPCClientError } from '@trpc/client';
import Routes from '@lib/routes';
import type { Account } from '@server/account/types';
import useCreateTransactions from '@lib/transactions/useCreateTransactions';
import client from '../api';

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
    [presets, account.csvImportPresetId]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileUploaded = useCallback(
    async (csv: string) => {
      if (!preset) {
        return;
      }

      try {
        const records = parse(csv, {
          skip_empty_lines: false,
          delimiter: preset.delimiter || ',',
        }) as string[][];

        const dateIndex = preset.fields.indexOf('Date');
        const descriptionIndex = preset.fields.indexOf('Description');
        const amountIndex = preset.fields.indexOf('Amount');
        const depositIndex = preset.fields.indexOf('Deposit');
        const withdrawalIndex = preset.fields.indexOf('Withdrawal');
        const feeIndex = preset.fields.indexOf('Fee');

        const transactions = records
          .slice(preset.rowsToSkipStart, records.length - preset.rowsToSkipEnd)
          .map((record) => {
            let amountStr =
              amountIndex > -1
                ? record[amountIndex]
                : depositIndex > -1 && record[depositIndex]
                ? record[depositIndex]
                : withdrawalIndex > -1 && record[withdrawalIndex]
                ? `-${record[withdrawalIndex]}`
                : '0';

            if (preset.decimal === '.') {
              amountStr = amountStr.replace(',', '');
            } else if (preset.decimal === ',') {
              amountStr = amountStr.replace('.', '').replace(',', '.');
            }

            const amount = parseFloat(amountStr);
            const fee = feeIndex > -1 ? parseFloat(record[feeIndex]) : 0;
            const description = record[descriptionIndex] || '';

            return {
              date: parseDate(record[dateIndex], preset.dateFormat, new Date()),
              description,
              amount: amount - fee,
              categoryId:
                categories?.find((category) =>
                  category.importPatterns.some((pattern) =>
                    description.toLowerCase().includes(pattern.toLowerCase())
                  )
                )?.id || null,
            };
          });

        await createTransactions({
          accountId: account.id,
          transactions,
        });
        void router.push(Routes.transactionsForAccount(account.id));
      } catch (e) {
        enqueueSnackbar({
          message:
            'Failed to process file. Check the import preset and the file.',
          variant: 'error',
        });
      }
    },
    [preset, categories, createTransactions, account.id, router]
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
    [handleFileUploaded]
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
