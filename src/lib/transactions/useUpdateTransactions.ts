import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.updateTransactions.useMutation>[0];

const useUpdateTransactions = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateTransactions.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: `Updated ${args[1].ids.length} ${
          args[1].ids.length > 1 ? 'transactions' : 'transaction'
        }.`,
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: `Failed to update ${args[1].ids.length} ${
          args[1].ids.length > 1 ? 'transactions' : 'transaction'
        }.`,
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
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
