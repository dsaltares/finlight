import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.updateAccount.useMutation>[0];

const useUpdateAccount = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateAccount.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getAccounts)),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
      ]),
  });
};

export default useUpdateAccount;
