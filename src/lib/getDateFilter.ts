import type { DateFilter } from '@server/types';
import { isDateRange, isPeriod } from '@server/types';
import type { FiltersByField } from './useFiltersFromUrl';

const getDateFilter = (filters: FiltersByField): DateFilter | undefined => {
  if (isPeriod(filters.period)) {
    return filters.period;
  }
  const range = {
    from: filters.from,
    until: filters.until,
  };
  if (isDateRange(range)) {
    return range;
  }
};

export default getDateFilter;
