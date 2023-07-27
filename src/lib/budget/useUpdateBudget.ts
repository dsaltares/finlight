import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.updateBudget.useMutation>[0];

const useUpdateAccount = (options?: Options) =>
  client.updateBudget.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Budget updated.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to update budget.',
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
  });

export default useUpdateAccount;
