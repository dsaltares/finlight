import { useRouter } from 'next/router';
import { useCallback } from 'react';

const useDialog = (queryParam: string) => {
  const { query, push } = useRouter();
  const open = query[queryParam] as string | undefined;
  const onOpen = useCallback(() => {
    void push({ query: { ...query, [queryParam]: true } }, undefined, {
      shallow: true,
    });
  }, [query, push, queryParam]);
  const onClose = useCallback(() => {
    const newQuery = { ...query };
    delete newQuery[queryParam];
    void push({ query: newQuery }, undefined, {
      shallow: true,
    });
  }, [query, push, queryParam]);
  return { open: !!open, onOpen, onClose };
};

export default useDialog;
