import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import client from '@lib/api';

type Options = Parameters<typeof client.createCategory.useMutation>[0];

const useCreateCategory = (options?: Options) => {
  const queryClient = useQueryClient();
  return client.createCategory.useMutation({
    ...options,
    onSettled: (...args) =>
      Promise.all([
        options?.onSettled?.apply(this, args),
        queryClient.invalidateQueries(getQueryKey(client.getCategories)),
      ]),
  });
};

export default useCreateCategory;
