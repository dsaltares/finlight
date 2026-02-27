'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import CreateUpdateGoalDialog from '@/components/CreateUpdateGoalDialog';
import { DataTable } from '@/components/DataTable';
import useDialogForId from '@/hooks/useDialogForId';
import { type RouterOutput, useTRPC } from '@/lib/trpc';
import useGoalTable from './useGoalTable';

type Goal = RouterOutput['savingsGoals']['list'][number];

type Props = {
  goals: Goal[];
  globalFilter: string | undefined;
};

export default function GoalTable({ goals, globalFilter }: Props) {
  const trpc = useTRPC();

  const {
    openFor: deleteGoalId,
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDialogForId();

  const { mutateAsync: deleteGoal, isPending: isDeleting } = useMutation(
    trpc.savingsGoals.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Goal deleted.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to delete goal. ${error.message}`
            : 'Failed to delete goal.',
        );
      },
    }),
  );

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    await deleteGoal({ id: deleteGoalId });
  };

  const {
    openFor: updateGoalId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogForId();

  const goalToUpdate = useMemo(
    () => goals.find((goal) => goal.id === updateGoalId),
    [goals, updateGoalId],
  );

  const { mutateAsync: updateGoal, isPending: isUpdating } = useMutation(
    trpc.savingsGoals.update.mutationOptions({
      onSuccess: () => {
        toast.success('Goal updated.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to update goal. ${error.message}`
            : 'Failed to update goal.',
        );
      },
    }),
  );

  const { mutate: completeGoal } = useMutation(
    trpc.savingsGoals.complete.mutationOptions({
      onSuccess: () => {
        toast.success('Goal completed.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to complete goal. ${error.message}`
            : 'Failed to complete goal.',
        );
      },
    }),
  );

  const { mutate: uncompleteGoal } = useMutation(
    trpc.savingsGoals.complete.mutationOptions({
      onSuccess: () => {
        toast.success('Goal marked as incomplete.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to update goal. ${error.message}`
            : 'Failed to update goal.',
        );
      },
    }),
  );

  const { columns, data, sorting, onSortingChange } = useGoalTable({
    goals,
    globalFilter,
    onUpdate: onUpdateDialogOpen,
    onDelete: onDeleteOpen,
    onComplete: (id) => completeGoal({ id, completed: true }),
    onUncomplete: (id) => uncompleteGoal({ id, completed: false }),
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        sorting={sorting}
        onSortingChange={onSortingChange}
        globalFilter={globalFilter}
      />

      <ConfirmationDialog
        id="delete-goal"
        title="Delete goal"
        open={deleteOpen}
        loading={isDeleting}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete this goal? This action cannot be
          undone.
        </p>
      </ConfirmationDialog>

      {goalToUpdate ? (
        <CreateUpdateGoalDialog
          goal={goalToUpdate}
          open={isUpdateDialogOpen}
          loading={isUpdating}
          onClose={onUpdateDialogClose}
          onUpdate={updateGoal}
        />
      ) : null}
    </>
  );
}
