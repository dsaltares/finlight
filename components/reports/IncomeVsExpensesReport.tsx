'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { SearchX } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { type ColumnMeta, DataTable } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import ReportTooltipContent from '@/components/reports/ReportTooltipContent';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';
import useInsightsFilters from '@/hooks/useInsightsFilters';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import { formatAmount } from '@/lib/format';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const chartConfig: ChartConfig = {
  income: { label: 'Income', color: '#16A34A' },
  expenses: { label: 'Expenses', color: '#DC2626' },
};

const ROW_LABELS = ['Income', 'Expenses', 'Difference'] as const;
const ROW_KEYS = ['income', 'expenses', 'difference'] as const;

type TransposedRow = {
  label: string;
  key: string;
  amounts: Record<string, number>;
};

export default function IncomeVsExpensesReport({
  compact,
}: {
  compact?: boolean;
} = {}) {
  const trpc = useTRPC();
  const { queryInput, displayCurrency } = useInsightsFilters();
  const { data, isPending: isLoading } = useQuery({
    ...trpc.reports.getIncomeVsExpensesReport.queryOptions(queryInput),
    placeholderData: keepPreviousData,
  });
  const currency = displayCurrency;
  const { sorting, onSortingChange } = useSortFromUrl();

  const rows = useMemo<TransposedRow[]>(
    () =>
      ROW_KEYS.map((key, i) => ({
        label: ROW_LABELS[i],
        key,
        amounts: Object.fromEntries(
          (data ?? []).map((d) => [d.bucket, d[key]]),
        ),
      })),
    [data],
  );

  const columns = useMemo<ColumnDef<TransposedRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: '',
        meta: { isSticky: true } satisfies ColumnMeta,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.label}</span>
        ),
      },
      ...(data ?? []).map<ColumnDef<TransposedRow>>((d) => ({
        id: d.bucket,
        accessorFn: (row: TransposedRow) => row.amounts[d.bucket] ?? 0,
        header: d.bucket,
        meta: { align: 'right' } satisfies ColumnMeta,
        cell: ({ row, getValue }) => {
          const val = getValue<number>();
          const key = row.original.key;
          const colorClass =
            key === 'income'
              ? 'text-green-700 dark:text-green-400'
              : key === 'expenses'
                ? 'text-red-700 dark:text-red-400'
                : val > 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400';
          return (
            <span className={cn(colorClass)}>
              {formatAmount(val, currency)}
            </span>
          );
        },
      })),
    ],
    [data, currency],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState Icon={SearchX}>No transactions found</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer
        config={chartConfig}
        className={compact ? 'h-48 w-full overflow-visible' : 'h-96 w-full'}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          {!compact && <XAxis dataKey="bucket" />}
          {!compact && <YAxis />}
          <ChartTooltip
            content={
              <ReportTooltipContent
                formatValue={(v) => formatAmount(v, currency)}
                footer={{ label: 'Net', valueKey: 'difference' }}
              />
            }
          />
          <Bar dataKey="income" fill="#16A34A" />
          <Bar dataKey="expenses" fill="#DC2626" />
        </BarChart>
      </ChartContainer>

      {!compact && (
        <DataTable
          columns={columns}
          data={rows}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
      )}
    </div>
  );
}
