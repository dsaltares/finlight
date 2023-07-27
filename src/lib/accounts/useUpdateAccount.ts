import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.updateAccount.useMutation>[0];

const useUpdateAccount = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateAccount.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Account updated.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to update account.',
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getAccounts)),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
        queryClient.invalidateQueries(getQueryKey(client.getBudget)),
      ]),
  });
};

export default useUpdateAccount;
