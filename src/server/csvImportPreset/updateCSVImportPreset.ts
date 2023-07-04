import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import {
  UpdateCSVImportPresetInput,
  UpdateCSVImportPresetOutput,
} from './types';

export const updateCSVImportPreset: Procedure<
  UpdateCSVImportPresetInput,
  UpdateCSVImportPresetOutput
> = async ({
  input: {
    id,
    name,
    fields,
    dateFormat,
    delimiter,
    decimal,
    rowsToSkipStart,
    rowsToSkipEnd,
  },
  ctx: { session },
}) => {
  await prisma.cSVImportPreset.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  return prisma.cSVImportPreset.update({
    where: {
      id,
    },
    data: {
      name,
      fields,
      dateFormat,
      delimiter,
      decimal,
      rowsToSkipStart,
      rowsToSkipEnd,
      deletedAt: null,
    },
  });
};

export default procedure
  .input(UpdateCSVImportPresetInput)
  .output(UpdateCSVImportPresetOutput)
  .mutation(updateCSVImportPreset);
