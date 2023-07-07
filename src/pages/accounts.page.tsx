import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateAccount from '@lib/accounts/useCreateCategory';
import AccountList from '@components/AccountList';
import CreateUpdateAccountDialog from '@components/CreateUpdateAccountDialog';

const AccountsPage: NextPage = () => {
  const { data: accounts } = client.getAccounts.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createAccount, isLoading: isCreating } =
    useCreateAccount();

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Categories
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
      <AccountList accounts={accounts || []} />
      <CreateUpdateAccountDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createAccount}
      />
    </Stack>
  );
};

export default WithAuthentication(AccountsPage);
