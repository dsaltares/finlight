'use client';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { SearchX } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { type ColumnMeta, DataTable } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';
import useInsightsFilters from '@/hooks/useInsightsFilters';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const chartConfig: ChartConfig = {
  inputTokens: { label: 'Input', color: '#06B6D4' },
  outputTokens: { label: 'Output', color: '#F59E0B' },
};

const ROW_LABELS = ['Input', 'Output', 'Total'] as const;
const ROW_KEYS = ['inputTokens', 'outputTokens', 'total'] as const;

const tokenFormatter = new Intl.NumberFormat();

type TransposedRow = {
  label: string;
  key: string;
  amounts: Record<string, number>;
};

export default function LlmTokensReport({
  compact,
}: {
  compact?: boolean;
} = {}) {
  const trpc = useTRPC();
  const { queryInput } = useInsightsFilters();
  const { data, isLoading } = useQuery(
    trpc.reports.getLlmTokensReport.queryOptions(queryInput),
  );
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
        cell: ({ row, getValue }) => (
          <span className={cn(row.original.key === 'total' && 'font-medium')}>
            {tokenFormatter.format(getValue<number>())}
          </span>
        ),
      })),
    ],
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState Icon={SearchX}>No LLM usage found</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer
        config={chartConfig}
        className={compact ? 'h-48 w-full' : 'h-96 w-full'}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          {!compact && <XAxis dataKey="bucket" />}
          {!compact && <YAxis />}
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor:
                          item.payload?.fill || item.color || undefined,
                      }}
                    />
                    <div className="flex flex-1 items-center justify-between gap-4">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {tokenFormatter.format(value as number)}
                      </span>
                    </div>
                  </>
                )}
              />
            }
          />
          {!compact && <ChartLegend content={<ChartLegendContent />} />}
          <Bar
            dataKey="inputTokens"
            name="Input"
            stackId="tokens"
            fill="#06B6D4"
          />
          <Bar
            dataKey="outputTokens"
            name="Output"
            stackId="tokens"
            fill="#F59E0B"
          />
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
