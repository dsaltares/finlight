'use client';

import { Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import ImportErrorsDialog from '@/components/ImportErrorsDialog';
import { Button } from '@/components/ui/button';
import useImportTransactions from '@/hooks/useImportTransactions';
import { IMPORT_ACCEPT } from '@/lib/fileImport';
import type { RouterOutput } from '@/lib/trpc';

type Account = RouterOutput['accounts']['list']['accounts'][number];

type Props = {
  account: Account;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function AccountRowActions({
  account,
  onUpdate,
  onDelete,
}: Props) {
  const {
    fileInputRef,
    handleUploadClick,
    handleFileSelected,
    isPending: isImporting,
    importErrors,
    errorsDialogOpen,
    handleErrorsDialogClose,
  } = useImportTransactions(account);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={isImporting}
          onClick={handleUploadClick}
          aria-label={`Import transactions for ${account.name}`}
        >
          {isImporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate(account.id)}
          aria-label={`Edit account ${account.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(account.id)}
          aria-label={`Delete account ${account.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept={IMPORT_ACCEPT}
          onChange={handleFileSelected}
        />
      </div>
      <ImportErrorsDialog
        errors={importErrors}
        open={errorsDialogOpen}
        onClose={handleErrorsDialogClose}
      />
    </>
  );
}
