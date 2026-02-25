'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import CreateUpdateAccountDialog from '@/components/CreateUpdateAccountDialog';
import { DataTable } from '@/components/DataTable';
import useDialogForId from '@/hooks/useDialogForId';
import { type RouterOutput, useTRPC } from '@/lib/trpc';
import useAccountTable from './useAccountTable';

type Account = RouterOutput['accounts']['list']['accounts'][number];

type Props = {
  accounts: Account[];
  baseCurrency: string;
};

export default function AccountTable({ accounts, baseCurrency }: Props) {
  const trpc = useTRPC();

  const {
    openFor: deleteAccountId,
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDialogForId();

  const { mutateAsync: deleteAccount, isPending: isDeleting } = useMutation(
    trpc.accounts.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Account deleted.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to delete account. ${error.message}`
            : 'Failed to delete account.',
        );
      },
    }),
  );

  const handleDelete = async () => {
    if (!deleteAccountId) return;
    await deleteAccount({ id: deleteAccountId });
  };

  const {
    openFor: updateAccountId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogForId();

  const accountToUpdate = useMemo(
    () => accounts.find((account) => account.id === updateAccountId),
    [accounts, updateAccountId],
  );

  const { mutateAsync: updateAccount, isPending: isUpdating } = useMutation(
    trpc.accounts.update.mutationOptions({
      onSuccess: () => {
        toast.success('Account updated.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to update account. ${error.message}`
            : 'Failed to update account.',
        );
      },
    }),
  );

  const { columns, data, sorting, onSortingChange, globalFilter } =
    useAccountTable({
      accounts,
      baseCurrency,
      onUpdate: onUpdateDialogOpen,
      onDelete: onDeleteOpen,
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
        id="delete-account"
        title="Delete account"
        open={deleteOpen}
        loading={isDeleting}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete this account? This action cannot be
          undone and all related transactions will also be deleted.
        </p>
      </ConfirmationDialog>

      {accountToUpdate ? (
        <CreateUpdateAccountDialog
          account={accountToUpdate}
          open={isUpdateDialogOpen}
          loading={isUpdating}
          onClose={onUpdateDialogClose}
          onUpdate={updateAccount}
        />
      ) : null}
    </>
  );
}
