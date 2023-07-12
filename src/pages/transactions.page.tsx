import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from '@mui/icons-material/Edit';
import type { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CreateUpdateTransactionDialog from '@components/CreateUpdateTransactionDialog';
import TransactionTable from '@components/TransactionTable';
import useCreateTransaction from '@lib/transactions/useCreateTransaction';
import TransactionFilterDialog from '@components/TransactionFilterDialog';
import useFiltersFromurl from '@lib/useFiltersFromUrl';

const TransactionsPage: NextPage = () => {
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const {
    open: isFilterDialogOpen,
    onOpen: onFilterDialogOpen,
    onClose: onFilterDialogClose,
  } = useDialog();
  const {
    open: multiDeleteOpen,
    onOpen: onMultiDeleteOpen,
    onClose: onMultiDeleteClose,
  } = useDialog();
  const {
    open: multiUpdateOpen,
    onOpen: onMultiUpdateOpen,
    onClose: onMultiUpdateClose,
  } = useDialog();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { hasFilters } = useFiltersFromurl();
  const { data: transactions } = client.getTransactions.useQuery({});
  const { data: accounts } = client.getAccounts.useQuery();
  const { data: categories } = client.getCategories.useQuery();
  const { mutateAsync: createTransaction, isLoading: isCreating } =
    useCreateTransaction();

  return (
    <Stack gap={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Stack direction="row" gap={1}>
          {Object.keys(rowSelection).length > 0 && (
            <>
              <IconButton color="error" onClick={onMultiDeleteOpen}>
                <DeleteIcon />
              </IconButton>
              <IconButton color="primary" onClick={onMultiUpdateOpen}>
                <EditIcon />
              </IconButton>
            </>
          )}
          <IconButton
            color={hasFilters ? 'primary' : 'default'}
            onClick={onFilterDialogOpen}
          >
            <FilterAltIcon />
          </IconButton>
          <IconButton color="primary" onClick={onCreateDialogOpen}>
            <AddIcon />
          </IconButton>
        </Stack>
      </Stack>
      <TransactionTable
        transactions={transactions || []}
        accounts={accounts || []}
        categories={categories || []}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        multiDeleteOpen={multiDeleteOpen}
        onMultiDeleteClose={onMultiDeleteClose}
        multiUpdateOpen={multiUpdateOpen}
        onMultiUpdateClose={onMultiUpdateClose}
      />
      <CreateUpdateTransactionDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        accounts={accounts || []}
        categories={categories || []}
        onClose={onCreateDialogClose}
        onCreate={createTransaction}
      />
      {isFilterDialogOpen && (
        <TransactionFilterDialog
          open={isFilterDialogOpen}
          onClose={onFilterDialogClose}
          accounts={accounts || []}
          categories={categories || []}
        />
      )}
    </Stack>
  );
};

export default WithAuthentication(TransactionsPage);
