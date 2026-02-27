'use client';

import { flexRender } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Check, Loader2 } from 'lucide-react';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import CreateUpdateTransactionDialog from '@/components/CreateUpdateTransactionDialog';
import type { UseTransactionTableArgs } from '@/components/TransactionTable/useTransactionTable';
import useTransactionTable from '@/components/TransactionTable/useTransactionTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TransactionTable(props: UseTransactionTableArgs) {
  const {
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
  } = useTransactionTable(props);

  return (
    <>
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible"
      >
        {(isInlineSaving || showSaved) && (
          <div className="absolute top-1 right-2 z-20">
            {isInlineSaving ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : showSaved ? (
              <Check className="size-3.5 text-muted-foreground" />
            ) : null}
          </div>
        )}
        <Table style={{ minWidth: table.getTotalSize() }}>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={`px-1 ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="size-3" />
                      ) : null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualizer.getVirtualItems().length > 0 ? (
              <>
                {virtualizer.getVirtualItems()[0]?.start > 0 && (
                  <tr key="spacer-top">
                    <td
                      colSpan={columns.length}
                      style={{
                        height: virtualizer.getVirtualItems()[0]?.start ?? 0,
                        padding: 0,
                      }}
                    />
                  </tr>
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <TableRow
                      key={virtualRow.index}
                      data-index={virtualRow.index}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-1">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {virtualizer.getTotalSize() -
                  (virtualizer.getVirtualItems().at(-1)?.end ?? 0) >
                  0 && (
                  <tr key="spacer-bottom">
                    <td
                      colSpan={columns.length}
                      style={{
                        height:
                          virtualizer.getTotalSize() -
                          (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                        padding: 0,
                      }}
                    />
                  </tr>
                )}
              </>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        id="delete-transaction"
        title="Delete transaction"
        open={isDeleteDialogOpen}
        loading={isDeleting}
        onClose={onDeleteDialogClose}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </p>
      </ConfirmationDialog>

      {transactionToUpdate ? (
        <CreateUpdateTransactionDialog
          transaction={transactionToUpdate}
          open={isUpdateDialogOpen}
          loading={isUpdating}
          accounts={accounts}
          onClose={onUpdateDialogClose}
          onUpdate={updateTransaction}
        />
      ) : null}
    </>
  );
}
