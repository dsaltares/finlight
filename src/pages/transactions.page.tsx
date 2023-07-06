import type { NextPage } from 'next';
import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CreateUpdateTransactionDialog from '@components/CreateUpdateTransactionDialog';
import TransactionTable from '@components/TransactionTable';
import useDialogFromUrl from '@lib/useDialogFromUrl';
import useCreateTransaction from '@lib/transactions/useCreateTransaction';
import useUpdateTransaction from '@lib/transactions/useUpdateTransaction';

const TransactionsPage: NextPage = () => {
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const {
    openFor: transactionId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogFromUrl('transactionId');
  const { data: transactions } = client.getTransactions.useQuery({});
  const { data: accounts } = client.getAccounts.useQuery();
  const { data: categories } = client.getCategories.useQuery();
  const { mutateAsync: createTransaction, isLoading: isCreating } =
    useCreateTransaction();
  const { mutateAsync: updateTransaction, isLoading: isUpdating } =
    useUpdateTransaction();
  const transaction = useMemo(
    () => transactions?.find((transaction) => transaction.id === transactionId),
    [transactions, transactionId]
  );

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Stack direction="row" gap={1}>
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
        onUpdateTransaction={onUpdateDialogOpen}
      />
      <CreateUpdateTransactionDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        accounts={accounts || []}
        categories={categories || []}
        onClose={onCreateDialogClose}
        onCreate={createTransaction}
      />
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
    </Stack>
  );
};

export default WithAuthentication(TransactionsPage);
