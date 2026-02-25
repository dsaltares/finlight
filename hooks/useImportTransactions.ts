import { useMutation } from '@tanstack/react-query';
import { type ChangeEventHandler, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { arrayBufferToBase64 } from '@/lib/fileImport';
import { type RouterOutput, useTRPC } from '@/lib/trpc';

type Account = RouterOutput['accounts']['list']['accounts'][number];

export default function useImportTransactions(account: Account) {
  const trpc = useTRPC();
  const { mutate: importFileMutation, isPending } = useMutation(
    trpc.transactions.importFile.mutationOptions({
      onSuccess: (count: number) => {
        toast.success(`Imported ${count} transactions.`);
      },
      onError: (e) => {
        toast.error(`Failed to import transactions. ${e.message}`);
      },
    }),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const buffer = reader.result as ArrayBuffer;
        importFileMutation({
          accountId: account.id,
          fileBase64: arrayBufferToBase64(buffer),
          fileName: file.name,
        });
      };
      reader.readAsArrayBuffer(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importFileMutation, account.id],
  );

  return {
    fileInputRef,
    isPending,
    handleUploadClick,
    handleFileSelected,
  };
}
