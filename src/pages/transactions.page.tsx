import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import type { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CreateUpdateTransactionDialog from '@components/CreateUpdateTransactionDialog';
import TransactionTable from '@components/TransactionTable';
import useCreateTransaction from '@lib/transactions/useCreateTransaction';

const TransactionsPage: NextPage = () => {
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const {
    open: multiDeleteOpen,
    onOpen: onMultiDeleteOpen,
    onClose: onMultiDeleteClose,
  } = useDialog();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { data: transactions } = client.getTransactions.useQuery({});
  const { data: accounts } = client.getAccounts.useQuery();
  const { data: categories } = client.getCategories.useQuery();
  const { mutateAsync: createTransaction, isLoading: isCreating } =
    useCreateTransaction();

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Stack direction="row" gap={1}>
          {Object.keys(rowSelection).length > 0 && (
            <Button
              color="primary"
              variant="contained"
              onClick={onMultiDeleteOpen}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          <Button
            color="primary"
            variant="contained"
            onClick={onCreateDialogOpen}
            startIcon={<AddIcon />}
          >
            New
          </Button>
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
      />
      <CreateUpdateTransactionDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        accounts={accounts || []}
        categories={categories || []}
        onClose={onCreateDialogClose}
        onCreate={createTransaction}
      />
    </Stack>
  );
};

export default WithAuthentication(TransactionsPage);
