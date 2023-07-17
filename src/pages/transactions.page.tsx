import type { NextPage } from 'next';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CreateUpdateTransactionDialog from '@components/CreateUpdateTransactionDialog';
import TransactionTable from '@components/TransactionTable';
import useCreateTransaction from '@lib/transactions/useCreateTransaction';
import TransactionFilterDialog from '@components/TransactionFilterDialog';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import Fab from '@components/Fab';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';
import EmptyState from '@components/EmptyState';
import type { TransactionType } from '@server/transaction/types';

const TransactionsPage: NextPage = () => {
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog('createTransaction');
  const {
    open: isFilterDialogOpen,
    onOpen: onFilterDialogOpen,
    onClose: onFilterDialogClose,
  } = useDialog('filterTransactions');
  const {
    open: multiDeleteOpen,
    onOpen: onMultiDeleteOpen,
    onClose: onMultiDeleteClose,
  } = useDialog('deleteTransactions');
  const {
    open: multiUpdateOpen,
    onOpen: onMultiUpdateOpen,
    onClose: onMultiUpdateClose,
  } = useDialog('updateTransactions');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const hasRowsSelected = Object.keys(rowSelection).length > 0;
  const { filtersByField, setFilters } = useFiltersFromUrl();
  const { data: transactions, isLoading: isLoadingTransactions } =
    client.getTransactions.useQuery({
      from: filtersByField.from,
      until: filtersByField.until,
      minAmount: filtersByField.minAmount
        ? parseFloat(filtersByField.minAmount)
        : undefined,
      maxAmount: filtersByField.maxAmount
        ? parseFloat(filtersByField.maxAmount)
        : undefined,
      accountId: filtersByField.accountId,
      type: filtersByField.type as TransactionType | undefined,
      categoryId: filtersByField.categoryId,
      description: filtersByField.description,
    });
  const { data, isLoading: isLoadingAccounts } = client.getAccounts.useQuery();
  const { data: categories, isLoading: isLoadingCategories } =
    client.getCategories.useQuery();
  const { mutateAsync: createTransaction, isLoading: isCreating } =
    useCreateTransaction();

  const isLoading =
    isLoadingTransactions || isLoadingAccounts || isLoadingCategories;
  let content = null;
  if (isLoading) {
    content = <FullScreenSpinner />;
  } else if (!transactions || transactions.length === 0) {
    content = (
      <EmptyState Icon={ReceiptLongIcon}>No transactions found.</EmptyState>
    );
  } else {
    content = (
      <TransactionTable
        transactions={transactions}
        accounts={data?.accounts || []}
        categories={categories || []}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        multiDeleteOpen={multiDeleteOpen}
        onMultiDeleteClose={onMultiDeleteClose}
        multiUpdateOpen={multiUpdateOpen}
        onMultiUpdateClose={onMultiUpdateClose}
      />
    );
  }

  return (
    <Stack gap={2} height="100%">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <TextField
          fullWidth
          placeholder="Search..."
          size="small"
          value={filtersByField.transactionsGlobally || ''}
          onChange={(e) => setFilters({ transactionsGlobally: e.target.value })}
        />
        <Stack direction="row" gap={1}>
          <IconButton
            color="error"
            onClick={onMultiDeleteOpen}
            disabled={!hasRowsSelected}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={onMultiUpdateOpen}
            disabled={!hasRowsSelected}
          >
            <EditIcon />
          </IconButton>
          <Badge
            badgeContent={Object.keys(filtersByField).length}
            color="primary"
          >
            <IconButton color="primary" onClick={onFilterDialogOpen}>
              <FilterAltIcon />
            </IconButton>
          </Badge>
        </Stack>
      </Stack>
      {content}
      <CreateUpdateTransactionDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        accounts={data?.accounts || []}
        categories={categories || []}
        onClose={onCreateDialogClose}
        onCreate={createTransaction}
      />
      {isFilterDialogOpen && (
        <TransactionFilterDialog
          open={isFilterDialogOpen}
          onClose={onFilterDialogClose}
          accounts={data?.accounts || []}
          categories={categories || []}
        />
      )}
      <Fab aria-label="New transaction" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </Stack>
  );
};

export default WithAuthentication(TransactionsPage);
