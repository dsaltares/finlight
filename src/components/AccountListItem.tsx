import { type ChangeEventHandler, useCallback, useMemo, useRef } from 'react';
import { parse } from 'csv-parse/sync';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Link from 'next/link';
import stringToColor from 'string-to-color';
import parseDate from 'date-fns/parse';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/router';
import Routes from '@lib/routes';
import type { Account } from '@server/account/types';
import flags from '@lib/flags';
import { formatAmount } from '@lib/format';
import type { CSVImportPreset } from '@server/csvImportPreset/types';
import useCreateTransactions from '@lib/transactions/useCreateTransactions';

type Props = {
  account: Account;
  presets: CSVImportPreset[];
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const AccountListItem = ({ account, presets, onUpdate, onDelete }: Props) => {
  const router = useRouter();
  const { mutateAsync: createTransactions, isLoading: isCreatingTransactions } =
    useCreateTransactions();
  const preset = useMemo(
    () => presets.find((preset) => preset.id === account.csvImportPresetId),
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

            return {
              date: parseDate(record[dateIndex], preset.dateFormat, new Date()),
              description: record[descriptionIndex] || '',
              amount: parseFloat(amountStr),
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
    [preset, createTransactions, account.id, router]
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
  return (
    <ListItem disableGutters>
      <ListItemButton
        component={Link}
        href={Routes.transactionsForAccount(account.id)}
      >
        <ListItemAvatar>
          <Avatar
            sx={{ backgroundColor: stringToColor(account.name) }}
            src={flags[account.currency.toLowerCase()]}
          >
            {account.name}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={account.name}
          secondary={formatAmount(account.balance, account.currency)}
        />
        <Stack direction="row" gap={1}>
          {!!preset && (
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                handleUploadClick();
              }}
              disabled={isCreatingTransactions}
            >
              {isCreatingTransactions ? (
                <CircularProgress size={24} />
              ) : (
                <FileUploadIcon />
              )}
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              onUpdate(account.id);
              e.preventDefault();
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              onDelete(account.id);
              e.preventDefault();
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </ListItemButton>
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="text/csv"
        onChange={handleFileSelected}
      />
    </ListItem>
  );
};

export default AccountListItem;
