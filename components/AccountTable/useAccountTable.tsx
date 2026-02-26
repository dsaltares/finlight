'use client';

import {
  type ColumnDef,
  type ColumnSort,
  createColumnHelper,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAccountFilter } from '@/hooks/useFilters';
import { serializeTransactionFilters } from '@/hooks/useTransactionFilters';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import flags from '@/lib/flags';
import { formatAmount } from '@/lib/format';
import type { RouterOutput } from '@/lib/trpc';
import AccountRowActions from './AccountRowActions';

type Account = RouterOutput['accounts']['list']['accounts'][number];

export const DefaultSort: ColumnSort = {
  id: 'balanceInBaseCurrency',
  desc: true,
};
const columnHelper = createColumnHelper<Account>();

type UseAccountTableArgs = {
  accounts: Account[];
  baseCurrency: string;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function useAccountTable({
  accounts,
  baseCurrency,
  onUpdate,
  onDelete,
}: UseAccountTableArgs): {
  columns: ColumnDef<Account, unknown>[];
  data: Account[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string | undefined;
} {
  const { debouncedAccountFilter } = useAccountFilter();
  const { sorting, onSortingChange } = useSortFromUrl(DefaultSort);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const href = serializeTransactionFilters('/dashboard/transactions', {
            accounts: [info.row.original.id],
            period: 'lastMonth',
          });
          return (
            <Link href={href} className="hover:underline">
              {info.getValue()}
            </Link>
          );
        },
      }),
      columnHelper.accessor('currency', {
        header: 'Currency',
        cell: (info) => {
          const currency = info.getValue();
          const flagSrc = flags[currency.toLowerCase() as keyof typeof flags];
          return (
            <span className="flex items-center gap-2">
              <Avatar size="sm">
                {flagSrc ? <AvatarImage src={flagSrc} alt={currency} /> : null}
                <AvatarFallback className="text-xs">{currency}</AvatarFallback>
              </Avatar>
              {currency}
            </span>
          );
        },
      }),
      columnHelper.accessor('balance', {
        header: 'Balance',
        cell: (info) => {
          const balance = info.getValue();
          const currency = info.row.original.currency;
          return (
            <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatAmount(balance, currency)}
            </span>
          );
        },
        meta: { align: 'right' as const },
      }),
      columnHelper.accessor('balanceInBaseCurrency', {
        header: `Balance (${baseCurrency})`,
        cell: (info) => {
          const balance = info.getValue();
          return (
            <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatAmount(balance, baseCurrency)}
            </span>
          );
        },
        meta: { align: 'right' as const },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: (info) => (
          <AccountRowActions
            account={info.row.original}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ),
        meta: { align: 'right' as const },
      }),
    ],
    [baseCurrency, onUpdate, onDelete],
  );

  return {
    columns: columns as ColumnDef<Account, unknown>[],
    data: accounts,
    sorting,
    onSortingChange,
    globalFilter: debouncedAccountFilter ?? undefined,
  };
}
