import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.deleteTransactions.useMutation>[0];

const useDeleteTransactions = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.deleteTransactions.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
      ]),
  });
};

export default useDeleteTransactions;
