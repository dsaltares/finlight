import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetCategorysInput, GetCategorysOutput } from './types';

export const getCategorys: Procedure<
  GetCategorysInput,
  GetCategorysOutput
> = async ({ ctx: { session } }) =>
  prisma.category.findMany({
    where: {
      userId: session?.userId as string,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

export default procedure
  .input(GetCategorysInput)
  .output(GetCategorysOutput)
  .query(getCategorys);
