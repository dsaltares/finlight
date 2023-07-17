import { useRouter } from 'next/router';
import { useCallback } from 'react';

const useDialogForId = (queryParam: string) => {
  const { query, push } = useRouter();
  const openFor = query[queryParam] as string | undefined;
  const onOpen = useCallback(
    (id: string) => {
      void push({ query: { ...query, [queryParam]: id } }, undefined, {
        shallow: true,
      });
    },
    [query, push, queryParam]
  );
  const onClose = useCallback(() => {
    const newQuery = { ...query };
    delete newQuery[queryParam];
    void push({ query: newQuery }, undefined, {
      shallow: true,
    });
  }, [query, push, queryParam]);
  return { openFor, open: !!openFor, onOpen, onClose };
};

export default useDialogForId;
