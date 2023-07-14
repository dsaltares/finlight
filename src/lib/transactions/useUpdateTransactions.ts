import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.updateTransactions.useMutation>[0];

const useUpdateTransactions = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateTransactions.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getTransactions)),
        queryClient.invalidateQueries(
          getQueryKey(client.getIncomeVsExpensesReport)
        ),
        queryClient.invalidateQueries(getQueryKey(client.getCategoryReport)),
      ]),
  });
};

export default useUpdateTransactions;
