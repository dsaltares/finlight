import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.deleteAccount.useMutation>[0];

const useDeleteAccount = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.deleteAccount.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getAccounts)),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
      ]),
  });
};

export default useDeleteAccount;
