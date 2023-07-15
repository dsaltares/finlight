import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.createCategory.useMutation>[0];

const useCreateCategory = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.createCategory.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Category created.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to create category.',
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getCategories)),
      ]),
  });
};

export default useCreateCategory;
