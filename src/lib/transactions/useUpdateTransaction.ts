import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.updateTransaction.useMutation>[0];

const useUpdateTransaction = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateTransaction.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Transaction updated.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to update transaction',
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

export default useUpdateTransaction;
