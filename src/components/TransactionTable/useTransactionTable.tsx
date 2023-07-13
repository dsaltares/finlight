import { useMemo } from 'react';
import {
  type RowData,
  type RowSelectionState,
  type OnChangeFn,
  type FilterFn,
  type Row,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import stringToColor from 'string-to-color';
import Checkbox from '@mui/material/Checkbox';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import PaidIcon from '@mui/icons-material/Paid';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import type { Transaction } from '@server/transaction/types';
import { formatAmount, formatDate } from '@lib/format';
import useSortFromUrl from '@lib/useSortFromUrl';
import useFiltersFromurl from '@lib/useFiltersFromUrl';

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric: boolean;
  }

  interface FilterFns {
    dateRangeFilter: FilterFn<TransactionTableRow>;
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

type TransactionTableRow = ReturnType<typeof toTransactionTableRow>;

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
  const theme = useTheme();
  const { query } = useRouter();
  const { sorting } = useSortFromUrl(DefaultSort);
  const { filters } = useFiltersFromurl();
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
        enableColumnFilter: false,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => formatDate(info.getValue()),
        filterFn: 'dateRangeFilter',
      }),
      columnHelper.accessor('accountId', {
        header: 'Account',
        cell: (info) => (
          <Link
            href={{
              query: {
                ...query,
                filterByAccountId: info.row.original.accountId,
              },
            }}
          >
            {info.row.original.accountName}
          </Link>
        ),
        filterFn: 'equalsString',
        enableColumnFilter: true,
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
        enableColumnFilter: true,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => {
          const type = info.getValue();
          const icon =
            type === 'Expense' ? (
              <PaymentIcon />
            ) : type === 'Income' ? (
              <PaidIcon />
            ) : (
              <SwapHorizIcon />
            );
          return (
            <Link
              href={{
                query: {
                  ...query,
                  filterByType: type,
                },
              }}
            >
              <Chip icon={icon} label={type} variant="outlined" clickable />
            </Link>
          );
        },
        enableColumnFilter: true,
      }),
      columnHelper.accessor('categoryId', {
        header: 'Category',
        cell: (info) =>
          info.row.original.categoryId && info.row.original.categoryName ? (
            <Link
              href={{
                query: {
                  ...query,
                  filterByCategoryId: info.row.original.categoryId,
                },
              }}
            >
              <Chip
                sx={{
                  backgroundColor: stringToColor(
                    info.row.original.categoryName
                  ),
                  color: theme.palette.getContrastText(
                    stringToColor(info.row.original.categoryName)
                  ),
                }}
                label={info.row.original.categoryName}
                clickable
              />
            </Link>
          ) : (
            ''
          ),
        enableColumnFilter: true,
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
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
    [query, onDeleteDialogOpen, onUpdateDialogOpen, theme.palette]
  );

  return useReactTable({
    data: tableTransactions,
    columns,
    state: {
      sorting,
      columnFilters: filters,
      rowSelection,
    },
    filterFns: {
      dateRangeFilter: (
        row: Row<TransactionTableRow>,
        _columnIds,
        filterValue: string | undefined
      ) => {
        const [from, to] = filterValue ? filterValue.split(',') : [null, null];
        if (from && row.original.date < from) {
          return false;
        }
        if (to && row.original.date > to) {
          return false;
        }
        return true;
      },
    },
    enableRowSelection: true,
    enableColumnFilters: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: onRowSelectionChange,
  });
};

export default useTransactionTable;
