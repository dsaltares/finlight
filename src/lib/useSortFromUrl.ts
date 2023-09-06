import type { ColumnSort } from '@tanstack/react-table';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

const useSortFromUrl = (defaultSort: ColumnSort | undefined = undefined) => {
  const { query, push } = useRouter();
  const hasSort = 'sortBy' in query;
  const sortBy = query.sortBy as string | undefined;
  const sortDir = query.sortDir as string | undefined;
  const sorting: ColumnSort[] = useMemo(() => {
    if (hasSort) {
      return sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [];
    }
    return defaultSort ? [defaultSort] : [];
  }, [sortBy, sortDir, defaultSort, hasSort]);
  const toggleSort = useCallback(
    (id: string) => {
      const currentSortBy = sortBy ?? defaultSort?.id;
      const currentSortDir = sortDir ?? (defaultSort?.desc ? 'desc' : 'asc');
      const newQuery = { ...query };

      if (currentSortBy === id && currentSortDir === 'desc') {
        newQuery.sortBy = id;
        newQuery.sortDir = 'asc';
      } else if (currentSortBy === id && currentSortDir === 'asc') {
        delete newQuery.sortBy;
        delete newQuery.sortDir;
      } else {
        newQuery.sortBy = id;
        newQuery.sortDir = 'desc';
      }

      void push({ query: newQuery }, undefined, { shallow: true });
    },
    [push, query, sortBy, sortDir, defaultSort],
  );
  return {
    sorting,
    toggleSort,
  };
};

export default useSortFromUrl;
