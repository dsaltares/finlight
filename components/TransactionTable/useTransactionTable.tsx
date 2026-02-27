'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import DescriptionCell from '@/components/TransactionTable/DescriptionCell';
import InlineAmountInput from '@/components/TransactionTable/InlineAmountInput';
import InlineCategorySelect from '@/components/TransactionTable/InlineCategorySelect';
import InlineTypeSelect from '@/components/TransactionTable/InlineTypeSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDialogForId from '@/hooks/useDialogForId';
import useTransactionFilters, {
  serializeTransactionFilters,
} from '@/hooks/useTransactionFilters';
import { formatDate } from '@/lib/format';
import { type RouterOutput, useTRPC } from '@/lib/trpc';
import type { TransactionType } from '@/server/trpc/procedures/schema';

type Transaction = RouterOutput['transactions']['list'][number];
type Account = RouterOutput['accounts']['list']['accounts'][number];
type Category = RouterOutput['categories']['list'][number];

export type TransactionRow = Transaction & {
  accountName: string;
  currency: string;
  categoryName: string | null;
  categoryColor: string | null;
};

export type UseTransactionTableArgs = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (value: RowSelectionState) => void;
};

const ROW_HEIGHT = 36;
const DEFAULT_SORT: SortingState = [{ id: 'date', desc: true }];

export default function useTransactionTable({
  transactions,
  accounts,
  categories,
  rowSelection,
  onRowSelectionChange,
}: UseTransactionTableArgs) {
  const trpc = useTRPC();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSelectedId = useRef<string | null>(null);
  const [sorting, onSortingChange] = useState<SortingState>(DEFAULT_SORT);
  const { setAccount } = useTransactionFilters();

  const {
    openFor: deleteOpenFor,
    open: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDialogForId();

  const {
    openFor: updateTransactionId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogForId();

  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useMutation(
    trpc.transactions.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Transaction deleted.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to delete transaction. ${error.message}`
            : 'Failed to delete transaction.',
        );
      },
    }),
  );

  const { mutateAsync: updateTransaction, isPending: isUpdating } = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        toast.success('Transaction updated.');
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to update transaction. ${error.message}`
            : 'Failed to update transaction.',
        );
      },
    }),
  );

  const queryClient = useQueryClient();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { mutate: inlineUpdate, isPending: isInlineSaving } = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        setShowSaved(true);
        clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
      },
      onError: (error) => {
        toast.error(
          error.message
            ? `Failed to update transaction. ${error.message}`
            : 'Failed to update transaction.',
        );
      },
    }),
  );

  const handleInlineUpdate = useCallback(
    (
      id: number,
      fields: Partial<{
        type: TransactionType;
        categoryId: number | null;
        amount: number;
      }>,
    ) => {
      inlineUpdate({ id, ...fields });
    },
    [inlineUpdate],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteOpenFor) return;
    await deleteTransaction({ id: deleteOpenFor });
  }, [deleteOpenFor, deleteTransaction]);

  const handleCopyDescription = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    });
  }, []);

  const transactionToUpdate = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction.id === updateTransactionId,
      ),
    [transactions, updateTransactionId],
  );

  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const account of accounts) {
      map.set(account.id, account);
    }
    return map;
  }, [accounts]);

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>();
    for (const category of categories) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const data: TransactionRow[] = useMemo(
    () =>
      transactions.map((transaction) => {
        const account = accountsById.get(transaction.accountId);
        const category = transaction.categoryId
          ? categoriesById.get(transaction.categoryId)
          : null;
        return {
          ...transaction,
          accountName: account?.name ?? 'Unknown account',
          currency: account?.currency ?? 'EUR',
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
        };
      }),
    [transactions, accountsById, categoriesById],
  );

  const columns: ColumnDef<TransactionRow>[] = useMemo(
    () => [
      {
        id: 'select',
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value: boolean | 'indeterminate') =>
              table.toggleAllRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row, table }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onClick={(e: MouseEvent) => {
              const rows = table.getRowModel().rows;
              const currentIndex = rows.findIndex((r) => r.id === row.id);
              if (e.shiftKey && lastSelectedId.current !== null) {
                const anchorIndex = rows.findIndex(
                  (r) => r.id === lastSelectedId.current,
                );
                if (anchorIndex !== -1 && currentIndex !== -1) {
                  e.preventDefault();
                  const start = Math.min(anchorIndex, currentIndex);
                  const end = Math.max(anchorIndex, currentIndex);
                  const next: RowSelectionState = {
                    ...table.getState().rowSelection,
                  };
                  for (let i = start; i <= end; i++) {
                    next[rows[i].id] = true;
                  }
                  table.setRowSelection(next);
                  return;
                }
              }
              lastSelectedId.current = row.id;
            }}
            onCheckedChange={(value: boolean | 'indeterminate') =>
              row.toggleSelected(!!value)
            }
          />
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue<string>()),
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        accessorKey: 'accountName',
        header: 'Account',
        size: 130,
        cell: ({ row }) => {
          const href = serializeTransactionFilters('/dashboard/transactions', {
            accounts: [row.original.accountId],
          });
          return (
            <Link
              href={href}
              className="hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setAccount(row.original.accountId);
              }}
            >
              {row.original.accountName}
            </Link>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <InlineAmountInput
            value={row.original.amount}
            currency={row.original.currency}
            onSave={(amount) => handleInlineUpdate(row.original.id, { amount })}
          />
        ),
        sortingFn: 'basic',
        size: 130,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 100,
        cell: ({ row }) => (
          <InlineTypeSelect
            value={row.original.type}
            onValueChange={(type) =>
              handleInlineUpdate(row.original.id, { type })
            }
          />
        ),
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => (
          <InlineCategorySelect
            value={row.original.categoryId}
            categories={categories}
            onValueChange={(categoryId) =>
              handleInlineUpdate(row.original.id, { categoryId })
            }
          />
        ),
        size: 140,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 200,
        cell: ({ getValue }) => {
          const value = getValue<string>();
          if (!value) return null;
          return (
            <DescriptionCell value={value} onCopy={handleCopyDescription} />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <EllipsisVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onUpdateDialogOpen(row.original.id)}
              >
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteDialogOpen(row.original.id)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      onUpdateDialogOpen,
      onDeleteDialogOpen,
      setAccount,
      handleInlineUpdate,
      categories,
      handleCopyDescription,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => `${row.id}`,
    enableRowSelection: true,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  return {
    scrollRef,
    table,
    columns,
    rows,
    virtualizer,
    isDeleteDialogOpen,
    isDeleting,
    onDeleteDialogClose,
    handleDelete,
    transactionToUpdate,
    isUpdateDialogOpen,
    isUpdating,
    accounts,
    onUpdateDialogClose,
    updateTransaction,
    isInlineSaving,
    showSaved,
  };
}
