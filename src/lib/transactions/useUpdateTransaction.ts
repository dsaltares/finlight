import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.updateTransaction.useMutation>[0];

const useUpdateTransaction = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateTransaction.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
      ]),
  });
};

export default useUpdateTransaction;
