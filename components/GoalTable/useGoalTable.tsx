'use client';

import {
  type ColumnDef,
  type ColumnSort,
  createColumnHelper,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import useSortFromUrl from '@/hooks/useSortFromUrl';
import { formatAmount, formatDate } from '@/lib/format';
import type { RouterOutput } from '@/lib/trpc';
import GoalRowActions from './GoalRowActions';

type Goal = RouterOutput['savingsGoals']['list'][number];

export const DefaultSort: ColumnSort = {
  id: 'percentage',
  desc: false,
};

const columnHelper = createColumnHelper<Goal>();

function formatDuration(startDate: string | null, deadline: string | null) {
  if (!startDate || !deadline) return '-';
  const days = differenceInDays(new Date(deadline), new Date(startDate));
  if (days < 0) return '-';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.round(days / 365);
  return `${years}y`;
}

type UseGoalTableArgs = {
  goals: Goal[];
  globalFilter: string | undefined;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
};

export default function useGoalTable({
  goals,
  globalFilter,
  onUpdate,
  onDelete,
  onComplete,
  onUncomplete,
}: UseGoalTableArgs): {
  columns: ColumnDef<Goal, unknown>[];
  data: Goal[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string | undefined;
} {
  const { sorting, onSortingChange } = useSortFromUrl(DefaultSort);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const isCompleted = !!info.row.original.completedAt;
          return (
            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
              {info.getValue()}
            </span>
          );
        },
      }),
      columnHelper.accessor('targetAmount', {
        header: 'Target',
        cell: (info) =>
          formatAmount(info.getValue(), info.row.original.currency),
        meta: { align: 'right' as const },
      }),
      columnHelper.accessor('currentAmount', {
        header: 'Current',
        cell: (info) => {
          const goal = info.row.original;
          const diff =
            goal.expectedAmount !== null
              ? goal.currentAmount - goal.expectedAmount
              : null;
          return (
            <div className="flex flex-col items-end">
              <span>{formatAmount(info.getValue(), goal.currency)}</span>
              {diff !== null && !goal.completedAt && (
                <span
                  className={`text-[10px] leading-tight ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {diff >= 0 ? '+' : ''}
                  {formatAmount(diff, goal.currency)}
                </span>
              )}
            </div>
          );
        },
        meta: { align: 'right' as const },
      }),
      columnHelper.accessor('percentage', {
        header: 'Progress',
        cell: (info) => {
          const pct = Math.round(info.getValue() * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('startDate', {
        header: 'Start',
        cell: (info) => {
          const val = info.getValue();
          return val ? formatDate(val) : '-';
        },
      }),
      columnHelper.accessor('deadline', {
        header: 'Deadline',
        cell: (info) => {
          const val = info.getValue();
          return val ? formatDate(val) : '-';
        },
      }),
      columnHelper.display({
        id: 'duration',
        header: 'Duration',
        enableSorting: false,
        cell: (info) =>
          formatDuration(
            info.row.original.startDate,
            info.row.original.deadline,
          ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: (info) => (
          <GoalRowActions
            goal={info.row.original}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
          />
        ),
        meta: { align: 'right' as const },
      }),
    ],
    [onUpdate, onDelete, onComplete, onUncomplete],
  );

  return {
    columns: columns as ColumnDef<Goal, unknown>[],
    data: goals,
    sorting,
    onSortingChange,
    globalFilter,
  };
}
