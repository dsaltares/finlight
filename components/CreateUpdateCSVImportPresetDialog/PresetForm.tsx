'use client';

import {
  Controller,
  type UseFieldArrayReturn,
  type UseFormReturn,
} from 'react-hook-form';
import ImportFields from '@/components/ImportFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImportPreview from './ImportPreview';
import type { CSVImportPresetFormValues, FileData } from './types';

const dateFormats = [
  'dd MM yy',
  'dd,MM,yy',
  'dd-MM-yy',
  'dd.MM.yy',
  "dd/MM'yy",
  'dd/MM/yy',
  'dd MM yyyy',
  'dd,MM,yyyy',
  'dd-MM-yyyy',
  'dd.MM.yyyy',
  "dd/MM'yyyy",
  'dd/MM/yyyy',
  'dd MMM yy',
  'dd-MMM-yy',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'yyyy-MM-dd HH:mm:ss',
];

type Props = {
  form: UseFormReturn<CSVImportPresetFormValues>;
  fieldArray: UseFieldArrayReturn<CSVImportPresetFormValues, 'fields'>;
  fileData: FileData;
  onFileDataChange: (data: FileData) => void;
};

export default function PresetForm({
  form,
  fieldArray,
  fileData,
  onFileDataChange,
}: Props) {
  const {
    watch,
    control,
    register,
    formState: { errors },
  } = form;

  const {
    fields,
    append: appendItem,
    remove: removeItem,
    move: moveItem,
  } = fieldArray;

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-x-hidden pb-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name', { required: true })} />
        {errors.name ? (
          <p className="text-xs text-destructive">Name is required.</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="decimal">Decimal character</Label>
          <Input id="decimal" {...register('decimal', { required: true })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="delimiter">CSV delimiter</Label>
          <Input
            id="delimiter"
            {...register('delimiter', { required: true })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="rowsToSkipStart">Skip rows start</Label>
          <Input
            id="rowsToSkipStart"
            type="number"
            step={1}
            {...register('rowsToSkipStart', { required: true })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="rowsToSkipEnd">Skip rows end</Label>
          <Input
            id="rowsToSkipEnd"
            type="number"
            step={1}
            {...register('rowsToSkipEnd', { required: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="dateFormat">Date format</Label>
        <Controller
          control={control}
          name="dateFormat"
          render={({ field }) => (
            <Input
              {...field}
              id="dateFormat"
              list="date-format-options"
              placeholder="yyyy-MM-dd"
            />
          )}
        />
        <datalist id="date-format-options">
          {dateFormats.map((dateFormat) => (
            <option key={dateFormat} value={dateFormat} />
          ))}
        </datalist>
      </div>

      <ImportFields
        fields={fields.map((field) => field.value)}
        onAppend={(value) => appendItem({ id: value, value })}
        onRemove={removeItem}
        onMove={moveItem}
      />

      <ImportPreview
        watch={watch}
        fileData={fileData}
        onFileDataChange={onFileDataChange}
      />
    </div>
  );
}
