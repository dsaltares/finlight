'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Landmark, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AccountTable from '@/components/AccountTable';
import BalanceCard from '@/components/BalanceCard';
import CreateUpdateAccountDialog from '@/components/CreateUpdateAccountDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useDialog from '@/hooks/use-dialog';
import useAccountsKeyboardShortcuts from '@/hooks/useAccountsKeyboardShortcuts';
import { useAccountFilter } from '@/hooks/useFilters';
import { useTRPC } from '@/lib/trpc';

export default function AccountsPage() {
  const trpc = useTRPC();
  const { data, isPending: isLoadingAccounts } = useQuery(
    trpc.accounts.list.queryOptions({}),
  );
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();

  useAccountsKeyboardShortcuts(onCreateDialogOpen);

  const { accountFilter, setAccountFilter } = useAccountFilter();

  const { mutateAsync: createAccount, isPending: isCreating } = useMutation(
    trpc.accounts.create.mutationOptions({
      onSuccess: () => {
        toast.success('Account created.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to create account. ${error.message}`
            : 'Failed to create account.',
        );
      },
    }),
  );

  const accounts = data?.accounts ?? [];
  const total = data?.total;
  const currenciesCount = new Set(accounts.map((account) => account.currency))
    .size;

  const isLoading = isLoadingAccounts;
  const hasAccounts = accounts.length > 0;

  let content = null;
  if (isLoading) {
    content = (
      <div className="flex w-full justify-center items-center h-full">
        <Spinner />
      </div>
    );
  } else if (!hasAccounts) {
    content = (
      <EmptyState Icon={Landmark}>You don't have any accounts yet.</EmptyState>
    );
  } else {
    content = (
      <AccountTable
        accounts={accounts}
        baseCurrency={total?.currency ?? 'EUR'}
      />
    );
  }

  return (
    <div
      className="flex min-h-0 flex-col gap-4 overflow-hidden"
      style={{
        height: 'calc(100dvh - var(--header-height) - var(--content-padding) * 2)',
      }}
    >
      {hasAccounts && total ? (
        <div className="flex shrink-0 flex-wrap items-start gap-3">
          <BalanceCard
            balanceInCents={total.value}
            currency={total.currency}
            accountsCount={accounts.length}
            currenciesCount={currenciesCount}
          />
        </div>
      ) : null}
      <div className="flex shrink-0 flex-row items-center gap-3">
        {hasAccounts ? (
          <Input
            placeholder="Search..."
            value={accountFilter ?? ''}
            onChange={(e) => setAccountFilter(e.target.value || null)}
            className="w-full"
          />
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onCreateDialogOpen}
              className="ml-auto shrink-0"
              aria-label="New account"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New account</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {content}
      </div>

      <CreateUpdateAccountDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createAccount}
      />
    </div>
  );
}
