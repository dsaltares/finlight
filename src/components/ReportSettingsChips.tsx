import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import createUTCDate from '@lib/createUTCDate';
import client from '@lib/api';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import { formatDate } from '@lib/format';
import type { Account } from '@server/account/types';
import {
  type Period,
  PeriodLabels,
  isDateRange,
  isPeriod,
} from '@server/types';

const ReportSettingsChips = () => {
  const { filtersByField, setFilters } = useFiltersFromUrl();
  const { data: accounts } = client.getAccounts.useQuery();

  const accountsById = useMemo(
    () =>
      (accounts?.accounts || []).reduce<Record<string, Account>>(
        (acc, account) => ({ ...acc, [account.id]: account }),
        {},
      ),
    [accounts],
  );

  const handleClearAccounts = () => setFilters({ accounts: undefined });
  const handleClearPeriod = () => setFilters({ period: undefined });
  const handleClearDate = () =>
    setFilters({ from: undefined, until: undefined });
  const handleClearTimeGranularity = () =>
    setFilters({ timeGranularity: undefined });

  if (Object.keys(filtersByField).length === 0) {
    return null;
  }

  const hasDateRange = isDateRange({
    from: filtersByField.from,
    until: filtersByField.until,
  });
  const onlyFrom = !!filtersByField.from && !filtersByField.until;
  const onlyUntil = !filtersByField.from && !!filtersByField.until;
  const selectedAccounts = filtersByField.accounts?.split(',') || [];

  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={2}>
      {isPeriod(filtersByField.period) && (
        <Chip
          variant="outlined"
          label={PeriodLabels[filtersByField.period as Period]}
          onDelete={handleClearPeriod}
        />
      )}
      {hasDateRange && (
        <Chip
          variant="outlined"
          label={
            onlyFrom
              ? `From ${formatDate(
                  createUTCDate(filtersByField.from as string),
                )}`
              : onlyUntil
              ? `Until ${formatDate(
                  createUTCDate(filtersByField.until as string),
                )}`
              : `Between ${formatDate(
                  createUTCDate(filtersByField.from as string),
                )} and ${formatDate(
                  createUTCDate(filtersByField.until as string),
                )}`
          }
          onDelete={handleClearDate}
        />
      )}
      {selectedAccounts.length > 0 && (
        <Chip
          variant="outlined"
          label={
            selectedAccounts.length === 1
              ? accountsById[selectedAccounts[0]].name
              : `${accountsById[selectedAccounts[0]].name} and ${
                  selectedAccounts.length - 1
                } more`
          }
          onDelete={handleClearAccounts}
        />
      )}
      {!!filtersByField.timeGranularity && (
        <Chip
          variant="outlined"
          label={filtersByField.timeGranularity}
          onDelete={handleClearTimeGranularity}
        />
      )}
    </Stack>
  );
};

export default ReportSettingsChips;
