'use client';

import { useMutation } from '@tanstack/react-query';
import { FileUp, Sparkles } from 'lucide-react';
import { type ChangeEventHandler, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { arrayBufferToBase64 } from '@/lib/fileImport';
import type { ImportPresetConfig } from '@/lib/importPresets';
import { useTRPC } from '@/lib/trpc';
import type { FileData } from './types';

const acceptSpreadsheet =
  '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type DetectedArgs = {
  preset: ImportPresetConfig;
  fileData: FileData;
};

type Props = {
  onDetected: (args: DetectedArgs) => void;
  onSkip: () => void;
};

export default function AIPresetDetector({ onDetected, onSkip }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const { mutate: generateFromFile, isPending } = useMutation(
    trpc.importPresets.generateFromFile.mutationOptions({
      onSuccess: (result) => {
        onDetected({
          preset: result.preset,
          fileData: {
            csvText: result.csvText,
            spreadsheetRows: result.rows,
          },
        });
      },
      onError: () => {
        toast.error(
          'Failed to detect import configuration. Try configuring manually.',
        );
      },
      onSettled: () => {
        if (ref.current) {
          ref.current.value = '';
        }
      },
    }),
  );

  const handleUploadClick = () => {
    ref.current?.click();
  };

  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const buffer = await file.arrayBuffer();
      const fileBase64 = arrayBufferToBase64(buffer);
      generateFromFile({ fileBase64, fileName: file.name });
    },
    [generateFromFile],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8">
        <Sparkles className="size-10 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-medium text-center">
            AI preset detection
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a CSV or Excel file and AI will automatically detect the
            import configuration.
          </p>
        </div>
        <Button type="button" onClick={handleUploadClick} disabled={isPending}>
          {isPending ? (
            <Spinner className="mr-1" />
          ) : (
            <FileUp className="size-4" />
          )}
          {isPending ? 'Detecting...' : 'Choose file'}
          <input
            ref={ref}
            hidden
            type="file"
            accept={acceptSpreadsheet}
            onChange={handleFileUpload}
          />
        </Button>
      </Card>
      <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
        Skip and configure manually
      </Button>
    </div>
  );
}
