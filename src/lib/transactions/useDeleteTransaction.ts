import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.deleteTransaction.useMutation>[0];

const useDeleteTransaction = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.deleteTransaction.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
      ]),
  });
};

export default useDeleteTransaction;
