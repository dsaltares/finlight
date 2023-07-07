import { useMemo } from 'react';
import {
  type RowData,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import stringToColor from 'string-to-color';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableBody from '@mui/material/TableBody';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import useSortFromUrl from '@lib/useSortFromUrl';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import type { Transaction } from '@server/transaction/types';
import { formatAmount, formatDate } from '@lib/format';
import useDialogForId from '@lib/useDialogForId';
import useDeleteTransaction from '@lib/transactions/useDeleteTransaction';
import useUpdateTransaction from '@lib/transactions/useUpdateTransaction';
import useDialogFromUrl from '@lib/useDialogFromUrl';
import Routes from '@lib/routes';
import ConfirmationDialog from './ConfirmationDialog';
import CreateUpdateTransactionDialog from './CreateUpdateTransactionDialog';

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric: boolean;
  }
}

const DefaultSort = { id: 'date', desc: true };

const toTransactionTableRow = (
  transaction: Transaction,
  accountsById: Record<string, Account>,
  categoriesById: Record<string, Category>
) => ({
  ...transaction,
  accountName: accountsById[transaction.accountId].name,
  currency: accountsById[transaction.accountId].currency,
  categoryName: transaction.categoryId
    ? categoriesById[transaction.categoryId].name
    : null,
});

type TransactionTableRow = ReturnType<typeof toTransactionTableRow>;

const columnHelper = createColumnHelper<TransactionTableRow>();

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

const TransactionTable = ({ transactions, categories, accounts }: Props) => {
  const { query } = useRouter();
  const { sorting, toggleSort } = useSortFromUrl(DefaultSort);
  const { filters } = useFiltersFromurl();
  const {
    openFor,
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDialogForId();
  const { mutateAsync: deleteTransaction, isLoading: isDeleting } =
    useDeleteTransaction();
  const handleDelete = () =>
    openFor ? deleteTransaction({ id: openFor }) : undefined;

  const {
    openFor: transactionId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogFromUrl('transactionId');
  const { mutateAsync: updateTransaction, isLoading: isUpdating } =
    useUpdateTransaction();
  const transaction = useMemo(
    () => transactions?.find((transaction) => transaction.id === transactionId),
    [transactions, transactionId]
  );

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
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => formatDate(info.getValue()),
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
      columnHelper.accessor('categoryId', {
        header: 'Category',
        cell: (info) =>
          info.row.original.categoryId && info.row.original.categoryName ? (
            <Link
              href={Routes.transactionsForCategory(
                info.row.original.categoryId
              )}
            >
              <Chip
                sx={{
                  backgroundColor: stringToColor(
                    info.row.original.categoryName
                  ),
                }}
                label={info.row.original.categoryName}
                clickable
              />
            </Link>
          ) : (
            ''
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
              onClick={() => onDeleteOpen(original.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ),
      }),
    ],
    [query, onDeleteOpen, onUpdateDialogOpen]
  );

  const table = useReactTable({
    data: tableTransactions,
    columns,
    state: {
      sorting,
      columnFilters: filters,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sortDirection={header.column.getIsSorted()}
                    align={
                      header.getContext().column.columnDef.meta?.numeric
                        ? 'right'
                        : 'left'
                    }
                  >
                    <TableSortLabel
                      active={!!header.column.getIsSorted()}
                      direction={header.column.getIsSorted() || undefined}
                      onClick={() => toggleSort(header.column.id)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} hover>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    align={
                      cell.column.columnDef.meta?.numeric ? 'right' : 'left'
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmationDialog
        id="delete-transaction"
        title="Delete transaction"
        open={deleteOpen}
        loading={isDeleting}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      >
        <Typography variant="body1">
          Are you sure you want to delete this transaction? The action cannot be
          undone.
        </Typography>
      </ConfirmationDialog>
      {!!transaction && (
        <CreateUpdateTransactionDialog
          transaction={transaction}
          open={isUpdateDialogOpen}
          loading={isUpdating}
          accounts={accounts || []}
          categories={categories || []}
          onClose={onUpdateDialogClose}
          onUpdate={updateTransaction}
        />
      )}
    </Paper>
  );
};

export default TransactionTable;