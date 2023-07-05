import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CreateUpdateTransactionDialog from '@components/CreateEditTransactionDialog';
import TransactionTable from '@components/TransactionTable';

const TransactionsPage: NextPage = () => {
  const { open, onOpen, onClose } = useDialog();
  const { data: transactions } = client.getTransactions.useQuery({});
  const { data: accounts } = client.getAccounts.useQuery();
  const { data: categories } = client.getCategories.useQuery();

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onOpen}>
          Add transaction
        </Button>
      </Stack>

      <TransactionTable
        transactions={transactions || []}
        accounts={accounts || []}
        categories={categories || []}
      />
      <CreateUpdateTransactionDialog
        open={open}
        onClose={onClose}
        loading={false}
        onCreate={() => {}}
      />
    </Stack>
  );
};

export default WithAuthentication(TransactionsPage);
