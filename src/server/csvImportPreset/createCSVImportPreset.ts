import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import {
  CreateCSVImportPresetInput,
  CreateCSVImportPresetOutput,
} from './types';

export const createCSVImportPreset: Procedure<
  CreateCSVImportPresetInput,
  CreateCSVImportPresetOutput
> = async ({
  input: {
    name,
    fields,
    dateFormat,
    delimiter,
    decimal,
    rowsToSkipStart,
    rowsToSkipEnd,
  },
  ctx: { session },
}) =>
  prisma.cSVImportPreset.create({
    data: {
      name,
      fields,
      dateFormat,
      delimiter,
      decimal,
      rowsToSkipStart,
      rowsToSkipEnd,
      userId: session?.userId as string,
    },
  });

export default procedure
  .input(CreateCSVImportPresetInput)
  .output(CreateCSVImportPresetOutput)
  .mutation(createCSVImportPreset);
