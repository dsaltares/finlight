import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateAccount from '@lib/accounts/useCreateAccount';
import AccountList from '@components/AccountList';
import CreateUpdateAccountDialog from '@components/CreateUpdateAccountDialog';
import Fab from '@components/Fab';

const AccountsPage: NextPage = () => {
  const { data: accounts } = client.getAccounts.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createAccount, isLoading: isCreating } =
    useCreateAccount();
  const { data: presets } = client.getCSVImportPresets.useQuery();

  return (
    <>
      <AccountList accounts={accounts || []} presets={presets || []} />
      <CreateUpdateAccountDialog
        presets={presets || []}
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createAccount}
      />
      <Fab aria-label="New account" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </>
  );
};

export default WithAuthentication(AccountsPage);
