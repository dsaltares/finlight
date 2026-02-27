'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { Plus, Target } from 'lucide-react';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useRef } from 'react';
import { toast } from 'sonner';
import CreateUpdateGoalDialog from '@/components/CreateUpdateGoalDialog';
import EmptyState from '@/components/EmptyState';
import GoalTable from '@/components/GoalTable/GoalTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import useDialog from '@/hooks/use-dialog';
import useGoalsKeyboardShortcuts from '@/hooks/useGoalsKeyboardShortcuts';
import { useTRPC } from '@/lib/trpc';

const filterParsers = {
  q: parseAsString.withDefault(''),
  completed: parseAsBoolean.withDefault(false),
};

export default function GoalsPage() {
  const trpc = useTRPC();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useQueryStates(filterParsers);
  const debouncedSearch = useDebounce(filters.q, 300);
  const { data: goals, isPending: isLoading } = useQuery(
    trpc.savingsGoals.list.queryOptions({
      includeCompleted: filters.completed,
    }),
  );
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();

  useGoalsKeyboardShortcuts({ onCreateDialogOpen, searchInputRef });

  const { mutateAsync: createGoal, isPending: isCreating } = useMutation(
    trpc.savingsGoals.create.mutationOptions({
      onSuccess: () => {
        toast.success('Goal created.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to create goal. ${error.message}`
            : 'Failed to create goal.',
        );
      },
    }),
  );

  let content = null;
  if (isLoading) {
    content = (
      <div className="flex w-full justify-center items-center h-full">
        <Spinner />
      </div>
    );
  } else if (!goals || goals.length === 0) {
    content = (
      <EmptyState Icon={Target}>
        You don&apos;t have any savings goals yet.
      </EmptyState>
    );
  } else {
    content = (
      <GoalTable
        goals={goals}
        globalFilter={debouncedSearch || undefined}
      />
    );
  }

  return (
    <div
      className="flex min-h-0 flex-col gap-4 overflow-hidden"
      style={{
        height:
          'calc(100dvh - var(--header-height) - var(--content-padding) * 2)',
      }}
    >
      <div className="flex shrink-0 flex-row items-center gap-3">
        <Input
          ref={searchInputRef}
          placeholder="Search..."
          value={filters.q}
          onChange={(event) =>
            setFilters({ q: event.target.value || null })
          }
          className="w-full"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Checkbox
            id="include-completed"
            checked={filters.completed}
            onCheckedChange={(checked) =>
              setFilters({ completed: checked === true || null })
            }
          />
          <Label
            htmlFor="include-completed"
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            Completed
          </Label>
        </div>
        <Button onClick={onCreateDialogOpen} className="shrink-0">
          <Plus className="size-4" />
          New goal
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {content}
      </div>

      <CreateUpdateGoalDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createGoal}
      />
    </div>
  );
}
