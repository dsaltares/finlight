import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetCSVImportPresetsInput, GetCSVImportPresetsOutput } from './types';

export const getCSVImportPresets: Procedure<
  GetCSVImportPresetsInput,
  GetCSVImportPresetsOutput
> = async ({ ctx: { session } }) =>
  prisma.cSVImportPreset.findMany({
    where: {
      userId: session?.userId as string,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

export default procedure
  .input(GetCSVImportPresetsInput)
  .output(GetCSVImportPresetsOutput)
  .query(getCSVImportPresets);
