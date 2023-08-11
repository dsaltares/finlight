import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

const useFiltersFromUrl = () => {
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
    [query],
  );
  const filtersByField = useMemo(
    () =>
      filters.reduce<Record<string, string | undefined>>(
        (acc, filter) => ({ ...acc, [filter.id]: filter.value }),
        {},
      ),
    [filters],
  );
  const setFilters = useCallback(
    (filters: Record<string, string | undefined>) => {
      const newQuery = { ...query };
      Object.keys(filters).forEach((id) => {
        const field = `filterBy${id[0].toUpperCase()}${id.slice(1)}`;
        newQuery[field] = filters[id];
        if (!filters[id]) {
          delete newQuery[field];
        }
      });
      void push({ query: newQuery }, undefined, { shallow: true });
    },
    [push, query],
  );

  return {
    filters,
    filtersByField,
    setFilters,
    hasFilters: filters.length > 0,
  };
};

export default useFiltersFromUrl;
