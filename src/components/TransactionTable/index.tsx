import { useMemo } from 'react';
import {
  type RowSelectionState,
  type OnChangeFn,
  flexRender,
} from '@tanstack/react-table';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableBody from '@mui/material/TableBody';
import useSortFromUrl from '@lib/useSortFromUrl';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import type {
  Transaction,
  UpdateTransactionsInput,
} from '@server/transaction/types';
import useDialogForId from '@lib/useDialogForId';
import useDeleteTransactions from '@lib/transactions/useDeleteTransactions';
import useUpdateTransaction from '@lib/transactions/useUpdateTransaction';
import useDialogFromUrl from '@lib/useDialogFromUrl';
import useUpdateTransactions from '@lib/transactions/useUpdateTransactions';
import ConfirmationDialog from '../ConfirmationDialog';
import CreateUpdateTransactionDialog from '../CreateUpdateTransactionDialog';
import UpdateTransactionsDialog from '../UpdateTransactionsDialog';
import useTransactionTable, { DefaultSort } from './useTransactionTable';

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  multiDeleteOpen: boolean;
  onMultiDeleteClose: () => void;
  multiUpdateOpen: boolean;
  onMultiUpdateClose: () => void;
};

const TransactionTable = ({
  transactions,
  categories,
  accounts,
  rowSelection,
  onRowSelectionChange,
  multiDeleteOpen,
  onMultiDeleteClose,
  multiUpdateOpen,
  onMultiUpdateClose,
}: Props) => {
  const {
    openFor: deleteOpenFor,
    open: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDialogForId();
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
  const { mutateAsync: deleteTransactions, isLoading: isDeleting } =
    useDeleteTransactions();
  const handleSingleDelete = () =>
    deleteOpenFor ? deleteTransactions({ ids: [deleteOpenFor] }) : undefined;
  const handleMultiDelete = async () => {
    await deleteTransactions({
      ids: table.getSelectedRowModel().flatRows.map((row) => row.original.id),
    });
    onRowSelectionChange({});
  };
  const { mutateAsync: updateTransactions, isLoading: isMultiUpdating } =
    useUpdateTransactions();

  const handleMultiUpdate = (data: Omit<UpdateTransactionsInput, 'ids'>) =>
    updateTransactions({
      ids: table.getSelectedRowModel().flatRows.map((row) => row.original.id),
      ...data,
    });

  const { toggleSort } = useSortFromUrl(DefaultSort);

  const table = useTransactionTable({
    transactions,
    accounts,
    categories,
    rowSelection,
    onRowSelectionChange,
    onUpdateDialogOpen,
    onDeleteDialogOpen,
  });

  return (
    <Paper elevation={0} variant="outlined">
      <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small">
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
                    {header.column.columnDef.enableSorting !== false ? (
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
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
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
        open={isDeleteDialogOpen}
        loading={isDeleting}
        onClose={onDeleteDialogClose}
        onConfirm={handleSingleDelete}
      >
        <Typography variant="body1">
          Are you sure you want to delete this transaction? The action cannot be
          undone.
        </Typography>
      </ConfirmationDialog>
      <ConfirmationDialog
        id="delete-transactions"
        title="Delete transactions"
        open={multiDeleteOpen}
        loading={isDeleting}
        onClose={onMultiDeleteClose}
        onConfirm={handleMultiDelete}
      >
        <Typography variant="body1">
          {`Are you sure you want to delete ${
            Object.keys(rowSelection).length
          } transactions? The action cannot be undone.`}
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
      {!!multiUpdateOpen && (
        <UpdateTransactionsDialog
          open={multiUpdateOpen}
          loading={isMultiUpdating}
          categories={categories || []}
          onClose={onMultiUpdateClose}
          onUpdate={handleMultiUpdate}
        />
      )}
    </Paper>
  );
};

export default TransactionTable;
