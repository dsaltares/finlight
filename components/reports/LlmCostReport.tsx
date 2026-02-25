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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';
import useInsightsFilters from '@/hooks/useInsightsFilters';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const MODEL_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#A78BFA',
  '#C4B5FD',
  '#818CF8',
  '#7C3AED',
  '#5B21B6',
  '#4338CA',
  '#6D28D9',
  '#4F46E5',
];

function formatCost(micros: number): string {
  const usd = micros / 1_000_000;
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

type ModelRow = {
  model: string;
  amounts: Record<string, number>;
};

export default function LlmCostReport({ compact }: { compact?: boolean } = {}) {
  const trpc = useTRPC();
  const { queryInput } = useInsightsFilters();
  const { data, isPending: isLoading } = useQuery({
    ...trpc.reports.getLlmCostReport.queryOptions(queryInput),
    placeholderData: keepPreviousData,
  });
  const { sorting, onSortingChange } = useSortFromUrl();

  const modelNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    const names = new Set<string>();
    for (const d of data) {
      for (const key of Object.keys(d.models)) {
        names.add(key);
      }
    }
    return [...names].sort();
  }, [data]);

  const config: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        modelNames.map((name, i) => [
          name,
          {
            label: name,
            color: MODEL_COLORS[i % MODEL_COLORS.length],
          },
        ]),
      ),
    [modelNames],
  );

  const rows = useMemo<ModelRow[]>(
    () => [
      ...modelNames.map((name) => ({
        model: name,
        amounts: Object.fromEntries(
          (data ?? []).map((d) => [d.bucket, d.models[name] ?? 0]),
        ),
      })),
      {
        model: 'Total',
        amounts: Object.fromEntries(
          (data ?? []).map((d) => [d.bucket, d.total]),
        ),
      },
    ],
    [modelNames, data],
  );

  const columns = useMemo<ColumnDef<ModelRow>[]>(
    () => [
      {
        accessorKey: 'model',
        header: 'Model',
        meta: { isSticky: true } satisfies ColumnMeta,
        cell: ({ row }) => (
          <span className={cn(row.original.model === 'Total' && 'font-medium')}>
            {row.original.model}
          </span>
        ),
      },
      ...(data ?? []).map<ColumnDef<ModelRow>>((d) => ({
        id: d.bucket,
        accessorFn: (row: ModelRow) => row.amounts[d.bucket] ?? 0,
        header: d.bucket,
        meta: { align: 'right' } satisfies ColumnMeta,
        cell: ({ row, getValue }) => (
          <span className={cn(row.original.model === 'Total' && 'font-medium')}>
            {formatCost(getValue<number>())}
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
        config={config}
        className={compact ? 'h-48 w-full overflow-visible' : 'h-96 w-full'}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          {!compact && <XAxis dataKey="bucket" />}
          {!compact && <YAxis />}
          <ChartTooltip
            content={
              <ReportTooltipContent
                formatValue={formatCost}
                footer={{ label: 'Total', valueKey: 'total' }}
              />
            }
          />
          {!compact && <ChartLegend content={<ChartLegendContent />} />}
          {modelNames.map((name, i) => (
            <Bar
              key={name}
              dataKey={`models.${name}`}
              name={name}
              stackId="cost"
              fill={MODEL_COLORS[i % MODEL_COLORS.length]}
            />
          ))}
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
