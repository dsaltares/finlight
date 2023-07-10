import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.updateCSVImportPreset.useMutation>[0];

const useUpdateCSVImportPreset = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.updateCSVImportPreset.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getCSVImportPresets)),
      ]),
  });
};

export default useUpdateCSVImportPreset;
