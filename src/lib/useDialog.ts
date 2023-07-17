import Router, { useRouter } from 'next/router';
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
    // Some dialogs set query params, so we need to wait a bit before closing
    setTimeout(() => {
      const newQuery = { ...Router.query };
      delete newQuery[queryParam];
      void Router.push({ query: newQuery }, undefined, {
        shallow: true,
      });
    });
  }, [queryParam]);
  return { open: !!open, onOpen, onClose };
};

export default useDialog;
