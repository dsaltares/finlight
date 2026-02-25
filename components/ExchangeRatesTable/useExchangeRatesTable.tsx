'use client';

import {
  type ColumnDef,
  type ColumnSort,
  createColumnHelper,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRateFilter } from '@/hooks/useFilters';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import flags from '@/lib/flags';
import { formatCurrencyValue, formatDate } from '@/lib/format';
import type { ExchangeRate } from '@/server/trpc/procedures/exchangeRates';

export const DefaultSort: ColumnSort = { id: 'ticker', desc: true };
const columnHelper = createColumnHelper<ExchangeRate>();

export default function useExchangeRatesTable(rates: ExchangeRate[]): {
  columns: ColumnDef<ExchangeRate, unknown>[];
  data: ExchangeRate[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string | undefined;
} {
  const { debouncedRateFilter } = useRateFilter();
  const { sorting, onSortingChange } = useSortFromUrl(DefaultSort);

  const columns = useMemo(
    () => [
      columnHelper.display({
        enableSorting: false,
        id: 'avatar',
        header: '',
        cell: (info) => (
          <Avatar size="sm">
            <AvatarImage
              src={flags[info.row.original.code.toLowerCase()]}
              alt=""
            />
            <AvatarFallback className="text-xs">
              {info.row.original.code}
            </AvatarFallback>
          </Avatar>
        ),
      }),
      columnHelper.accessor('ticker', {
        header: 'Ticker',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('currency', {
        header: 'Currency',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('close', {
        header: 'Rate',
        cell: (info) => (
          <span className="text-right tabular-nums">
            {formatCurrencyValue(info.getValue() ?? 1.0)}{' '}
            {info.row.original.code}
          </span>
        ),
        meta: { align: 'right' as const },
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('code', {
        header: '',
        cell: () => null,
        meta: { isHidden: true },
        enableSorting: false,
      }),
    ],
    [],
  );

  return {
    columns: columns as ColumnDef<ExchangeRate, unknown>[],
    data: rates,
    sorting,
    onSortingChange,
    globalFilter: debouncedRateFilter ?? undefined,
  };
}
