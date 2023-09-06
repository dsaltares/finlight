import Router, { useRouter } from 'next/router';
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
    [query, push, queryParam],
  );
  const onClose = useCallback(() => {
    // Some dialogs set query params, so we need to wait a bit before closing
    setTimeout(() => {
      const newQuery = { ...Router.query };
      delete newQuery[queryParam];
      void Router.push({ query: newQuery }, undefined, {
        shallow: true,
      });
    });
  }, [queryParam]);
  return { openFor, open: !!openFor, onOpen, onClose };
};

export default useDialogForId;
