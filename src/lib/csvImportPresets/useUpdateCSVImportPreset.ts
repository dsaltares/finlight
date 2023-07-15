import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { enqueueSnackbar } from 'notistack';
import client from '@lib/api';

type Options = Parameters<typeof client.updateCSVImportPreset.useMutation>[0];

const useUpdateCSVImportPreset = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateCSVImportPreset.useMutation({
    ...options,
    onSuccess: (...args) => {
      enqueueSnackbar({
        message: 'Import preset updated.',
        variant: 'success',
      });
      return options?.onSuccess?.apply(this, args);
    },
    onError: (...args) => {
      enqueueSnackbar({
        message: 'Failed to update import preset.',
        variant: 'error',
      });
      return options?.onError?.apply(this, args);
    },
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getCSVImportPresets)),
      ]),
  });
};

export default useUpdateCSVImportPreset;
