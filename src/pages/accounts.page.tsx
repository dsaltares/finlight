import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateAccount from '@lib/accounts/useCreateAccount';
import AccountList from '@components/AccountList';
import CreateUpdateAccountDialog from '@components/CreateUpdateAccountDialog';
import Fab from '@components/Fab';
import EmptyState from '@components/EmptyState';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';

const AccountsPage: NextPage = () => {
  const { data: accounts, isLoading: isLoadingAccounts } =
    client.getAccounts.useQuery();
  const { data: presets, isLoading: isLoadingPresets } =
    client.getCSVImportPresets.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog('createAccount');
  const { mutateAsync: createAccount, isLoading: isCreating } =
    useCreateAccount();

  const isLoading = isLoadingAccounts || isLoadingPresets;
  let content = null;
  if (isLoading) {
    content = <FullScreenSpinner />;
  } else if (!accounts || accounts.length === 0) {
    content = (
      <EmptyState
        Icon={AccountBalanceIcon}
      >{`You don't have any accounts yet.`}</EmptyState>
    );
  } else {
    content = <AccountList accounts={accounts} presets={presets || []} />;
  }

  return (
    <>
      {content}
      {isCreateDialogOpen && (
        <CreateUpdateAccountDialog
          presets={presets || []}
          open={isCreateDialogOpen}
          loading={isCreating}
          onClose={onCreateDialogClose}
          onCreate={createAccount}
        />
      )}
      <Fab aria-label="New account" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </>
  );
};

export default WithAuthentication(AccountsPage);
