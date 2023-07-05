import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

const useFiltersFromurl = () => {
  const { query, push } = useRouter();
  const filters = useMemo(
    () =>
      Object.keys(query)
        .filter((key) => key.startsWith('filterBy'))
        .map((key) => {
          const id = key.split('filterBy')[1];
          return {
            id: id[0].toLowerCase() + id.slice(1),
            value: query[key] as string,
          };
        }),
    [query]
  );
  const setFilter = useCallback(
    (id: string, value: string | undefined) => {
      const newQuery = { ...query, id: value };
      if (!value) {
        delete newQuery.id;
      }

      void push({ query: newQuery }, undefined, { shallow: true });
    },
    [push, query]
  );
  return {
    filters,
    setFilter,
  };
};

export default useFiltersFromurl;
