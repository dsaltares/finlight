import { useDebounce } from '@uidotdev/usehooks';
import { useQueryState } from 'nuqs';

export function useRateFilter() {
  const [rateFilter, setRateFilter] = useQueryState('rateFilter');
  const debouncedRateFilter = useDebounce(rateFilter, 500);
  return {
    rateFilter,
    setRateFilter,
    debouncedRateFilter,
  };
}

export function useAccountFilter() {
  const [accountFilter, setAccountFilter] = useQueryState('accountFilter');
  const debouncedAccountFilter = useDebounce(accountFilter, 500);
  return {
    accountFilter,
    setAccountFilter,
    debouncedAccountFilter,
  };
}
