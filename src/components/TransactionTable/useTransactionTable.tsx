import { useMemo } from 'react';
import {
  type RowData,
  type RowSelectionState,
  type OnChangeFn,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import type { Transaction } from '@server/transaction/types';
import { formatAmount, formatDate } from '@lib/format';
import useSortFromUrl from '@lib/useSortFromUrl';
import CategoryChip from '@components/CategoryChip';
import TransactionTypeChip from '@components/TransactionTypeChip';
import AccountLink from '@components/AccountLink';

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric: boolean;
  }
}

export const DefaultSort = { id: 'date', desc: true };

const toTransactionTableRow = (
  transaction: Transaction,
  accountsById: Record<string, Account>,
  categoriesById: Record<string, Category>
) => ({
  ...transaction,
  accountName: accountsById[transaction.accountId].name,
  currency: accountsById[transaction.accountId].currency,
  categoryName: transaction.categoryId
    ? categoriesById[transaction.categoryId]?.name || null
    : null,
});

export type TransactionTableRow = ReturnType<typeof toTransactionTableRow>;

const columnHelper = createColumnHelper<TransactionTableRow>();

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onUpdateDialogOpen: (id: string) => void;
  onDeleteDialogOpen: (id: string) => void;
};

const useTransactionTable = ({
  transactions,
  accounts,
  categories,
  rowSelection,
  onRowSelectionChange,
  onUpdateDialogOpen,
  onDeleteDialogOpen,
}: Props) => {
  const { sorting } = useSortFromUrl(DefaultSort);
  const tableTransactions = useMemo(() => {
    const accountsById = (accounts || []).reduce(
      (acc, account) => ({
        ...acc,
        [account.id]: account,
      }),
      {}
    );
    const categoriesById = (categories || []).reduce(
      (acc, category) => ({
        ...acc,
        [category.id]: category,
      }),
      {}
    );
    return (transactions || []).map((transaction) =>
      toTransactionTableRow(transaction, accountsById, categoriesById)
    );
  }, [accounts, transactions, categories]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'selection',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            disabled={!row.getCanSelect()}
          />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('accountId', {
        header: 'Account',
        cell: (info) => (
          <AccountLink
            id={info.getValue()}
            name={info.row.original.accountName}
          />
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <Typography
            color={info.getValue() > 0 ? 'green' : 'red'}
            fontSize="inherit"
          >
            {formatAmount(info.getValue(), info.row.original.currency)}
          </Typography>
        ),
        meta: { numeric: true },
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => <TransactionTypeChip type={info.getValue()} />,
      }),
      columnHelper.accessor('categoryId', {
        header: 'Category',
        cell: (info) => (
          <CategoryChip
            id={info.getValue()}
            name={info.row.original.categoryName}
          />
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row: { original } }) => (
          <Stack direction="row" gap={1}>
            <IconButton
              aria-label="Edit"
              onClick={() => onUpdateDialogOpen(original.id)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label="Delete"
              onClick={() => onDeleteDialogOpen(original.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ),
      }),
    ],
    [onDeleteDialogOpen, onUpdateDialogOpen]
  );

  return useReactTable({
    data: tableTransactions,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: onRowSelectionChange,
  });
};

export default useTransactionTable;
