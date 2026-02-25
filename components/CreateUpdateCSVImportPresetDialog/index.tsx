'use client';

import { useEffect, useState } from 'react';
import { type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { ImportPresetConfig } from '@/lib/importPresets';
import type { RouterInput, RouterOutput } from '@/lib/trpc';
import AIPresetDetector from './AIPresetDetector';
import PresetForm from './PresetForm';
import type { CSVImportPresetFormValues, FileData } from './types';

type BaseProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
};

type CreateProps = {
  onCreate: (input: RouterInput['importPresets']['create']) => Promise<unknown>;
  preset?: never;
  onUpdate?: never;
};

type EditProps = {
  preset: RouterOutput['importPresets']['list'][number];
  onUpdate: (input: RouterInput['importPresets']['update']) => Promise<unknown>;
  onCreate?: never;
};

type Props = BaseProps & (CreateProps | EditProps);

const id = 'create-update-csv-import-preset-dialog';

type Step = 'ai-detect' | 'manual';

const emptyFileData: FileData = { csvText: '', spreadsheetRows: [] };

export default function CreateUpdateCSVImportPresetDialog({
  open,
  loading,
  preset,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const isEditing = !!preset;
  const [step, setStep] = useState<Step>(isEditing ? 'manual' : 'ai-detect');
  const [fileData, setFileData] = useState<FileData>(emptyFileData);

  useEffect(() => {
    if (open && !isEditing) {
      setStep('ai-detect');
      setFileData(emptyFileData);
    }
  }, [open, isEditing]);

  const form = useForm<CSVImportPresetFormValues>({
    mode: 'onBlur',
    defaultValues: {
      name: preset?.name,
      decimal: preset?.decimal ?? '.',
      delimiter: preset?.delimiter ?? ',',
      dateFormat: preset?.dateFormat ?? 'yyyy-MM-dd',
      fields:
        preset?.fields.map((field) => ({ id: field, value: field })) ?? [],
      rowsToSkipStart: (preset?.rowsToSkipStart ?? 0).toString(),
      rowsToSkipEnd: (preset?.rowsToSkipEnd ?? 0).toString(),
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  type HandleDetectedArgs = {
    preset: ImportPresetConfig;
    fileData: FileData;
  };

  const handleDetected = ({
    preset: detected,
    fileData: newFileData,
  }: HandleDetectedArgs) => {
    form.reset({
      name: form.getValues('name') || '',
      decimal: detected.decimal,
      delimiter: detected.delimiter,
      dateFormat: detected.dateFormat,
      fields: detected.fields.map((field) => ({ id: field, value: field })),
      rowsToSkipStart: detected.rowsToSkipStart.toString(),
      rowsToSkipEnd: detected.rowsToSkipEnd.toString(),
    });
    setFileData(newFileData);
    setStep('manual');
  };

  const onSubmit: SubmitHandler<CSVImportPresetFormValues> = async (values) => {
    const rowsToSkipStart = Number.parseInt(values.rowsToSkipStart, 10);
    const rowsToSkipEnd = Number.parseInt(values.rowsToSkipEnd, 10);
    const importFields = values.fields.map((field) => field.value);
    if (preset) {
      await onUpdate({
        ...preset,
        ...values,
        rowsToSkipStart,
        rowsToSkipEnd,
        fields: importFields,
      });
    } else {
      await onCreate({
        ...values,
        rowsToSkipStart,
        rowsToSkipEnd,
        fields: importFields,
      });
    }
    onClose();
  };

  const title = preset ? 'Edit import preset' : 'Create import preset';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        id={id}
        className="flex h-[calc(100dvh-2rem)] flex-col overflow-hidden max-w-[calc(100dvw-2rem)] sm:max-w-[calc(100dvw-2rem)]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <form
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event);
          }}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
        >
          <DialogHeader className="shrink-0">
            <h2 className="text-sm font-medium">{title}</h2>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {step === 'ai-detect' ? (
              <AIPresetDetector
                onDetected={handleDetected}
                onSkip={() => setStep('manual')}
              />
            ) : (
              <PresetForm
                form={form}
                fieldArray={fieldArray}
                fileData={fileData}
                onFileDataChange={setFileData}
              />
            )}
          </div>

          <DialogFooter className="shrink-0">
            {step === 'manual' && !isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('ai-detect')}
              >
                Back
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step === 'manual' ? (
              <Button
                type="submit"
                disabled={loading || !form.formState.isValid}
              >
                {loading ? <Spinner className="mr-1" /> : null}
                Save
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
