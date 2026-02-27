'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import CurrencyAutocomplete, {
  currencyOptionsById,
} from '@/components/CurrencyAutocomplete';
import type { Option as ComboboxOption } from '@/components/combobox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultipleSelector, {
  type Option as MultipleSelectorOption,
} from '@/components/ui/multiple-selector';
import { Spinner } from '@/components/ui/spinner';
import type { RouterInput, RouterOutput } from '@/lib/trpc';
import { useTRPC } from '@/lib/trpc';

type Goal = RouterOutput['savingsGoals']['list'][number];

type BaseDialogProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
};

type CreateDialogProps = {
  onCreate: (
    input: RouterInput['savingsGoals']['create'],
  ) => Promise<unknown>;
  goal?: never;
  onUpdate?: never;
};

type UpdateDialogProps = {
  goal: Goal;
  onUpdate: (
    input: RouterInput['savingsGoals']['update'],
  ) => Promise<unknown>;
  onCreate?: never;
};

type Props = BaseDialogProps & (CreateDialogProps | UpdateDialogProps);

type GoalFormValues = {
  name: string;
  targetAmount: string;
  currency: ComboboxOption;
  startDate: string;
  deadline: string;
  accountIds: MultipleSelectorOption[];
};

export default function CreateUpdateGoalDialog({
  open,
  loading,
  goal,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const trpc = useTRPC();
  const { data: settings } = useQuery(trpc.userSettings.get.queryOptions());
  const { data: accountsData } = useQuery(
    trpc.accounts.list.queryOptions({}),
  );
  const defaultCurrency = settings?.defaultCurrency ?? 'EUR';
  const accounts = accountsData?.accounts ?? [];

  const accountOptions: MultipleSelectorOption[] = accounts.map((a) => ({
    value: `${a.id}`,
    label: a.name,
  }));

  const title = goal ? 'Edit goal' : 'Create goal';

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<GoalFormValues>({
    mode: 'onBlur',
    defaultValues: {
      name: goal?.name ?? '',
      targetAmount: goal ? (goal.targetAmount / 100).toString() : '',
      currency: currencyOptionsById[goal?.currency ?? defaultCurrency],
      startDate: goal?.startDate ?? '',
      deadline: goal?.deadline ?? '',
      accountIds:
        goal?.accountIds.map((id) => {
          const account = accounts.find((a) => a.id === id);
          return { value: `${id}`, label: account?.name ?? `${id}` };
        }) ?? [],
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: goal?.name ?? '',
      targetAmount: goal ? (goal.targetAmount / 100).toString() : '',
      currency: currencyOptionsById[goal?.currency ?? defaultCurrency],
      startDate: goal?.startDate ?? '',
      deadline: goal?.deadline ?? '',
      accountIds:
        goal?.accountIds.map((id) => {
          const account = accounts.find((a) => a.id === id);
          return { value: `${id}`, label: account?.name ?? `${id}` };
        }) ?? [],
    });
  }, [open, goal, reset, accounts, defaultCurrency]);

  const onSubmit: SubmitHandler<GoalFormValues> = async (values) => {
    const name = values.name.trim();
    const targetAmountMajor = Number.parseFloat(values.targetAmount);
    if (!name || Number.isNaN(targetAmountMajor) || targetAmountMajor <= 0) {
      return;
    }

    const payload = {
      name,
      targetAmount: Math.round(targetAmountMajor * 100),
      currency: values.currency.value,
      startDate: values.startDate || null,
      deadline: values.deadline || null,
      accountIds: values.accountIds.map((o) => Number.parseInt(o.value, 10)),
    };

    if (goal) {
      await onUpdate({ id: goal.id, ...payload });
    } else {
      await onCreate(payload);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent id="create-update-goal-dialog">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <DialogHeader>
            <h2 className="text-sm font-medium">{title}</h2>
          </DialogHeader>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              {...register('name', { required: true })}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-currency">Currency</Label>
            <Controller
              control={control}
              name="currency"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <div id="goal-currency">
                  <CurrencyAutocomplete value={value} onChange={onChange} />
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-target-amount">Target amount</Label>
            <Input
              id="goal-target-amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('targetAmount', { required: true })}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-start-date">Start date (optional)</Label>
            <Input
              id="goal-start-date"
              type="date"
              {...register('startDate')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-deadline">Deadline (optional)</Label>
            <Input
              id="goal-deadline"
              type="date"
              {...register('deadline')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="goal-accounts">Linked accounts (optional)</Label>
            <Controller
              control={control}
              name="accountIds"
              render={({ field: { value, onChange } }) => (
                <MultipleSelector
                  value={value}
                  onChange={onChange}
                  defaultOptions={accountOptions}
                  placeholder="Select accounts..."
                  inputProps={{
                    id: 'goal-accounts',
                  }}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Link accounts to auto-track balance toward the target.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? <Spinner className="mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
