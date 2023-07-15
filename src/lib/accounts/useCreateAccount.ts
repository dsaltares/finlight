import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.createAccount.useMutation>[0];

const useCreateAccount = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.createAccount.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Account created.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to create account.',
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getAccounts)),
      ]),
  });
};

export default useCreateAccount;
