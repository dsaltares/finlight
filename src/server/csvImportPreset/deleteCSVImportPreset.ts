import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import {
  DeleteCSVImportPresetInput,
  DeleteCSVImportPresetOutput,
} from './types';

export const deleteCSVImportPreset: Procedure<
  DeleteCSVImportPresetInput,
  DeleteCSVImportPresetOutput
> = async ({ input: { id }, ctx: { session } }) => {
  await prisma.cSVImportPreset.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  await prisma.cSVImportPreset.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

export default procedure
  .input(DeleteCSVImportPresetInput)
  .output(DeleteCSVImportPresetOutput)
  .mutation(deleteCSVImportPreset);
