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
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import useSortFromUrl from '@lib/useSortFromUrl';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import type { Transaction } from '@server/transaction/types';
import { formatAmount, formatDate } from '@lib/format';

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
        header: 'Ammount',
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
      columnHelper.accessor('categoryName', {
        header: 'Category',
        cell: (info) => (info.getValue() ? info.getValue() : ''),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
    ],
    [query]
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
    </Paper>
  );
};

export default TransactionTable;
