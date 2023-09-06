import createUTCDate from '@lib/createUTCDate';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { DeleteCategoryInput, DeleteCategoryOutput } from './types';

export const deleteCategory: Procedure<
  DeleteCategoryInput,
  DeleteCategoryOutput
> = async ({ input: { id }, ctx: { session } }) => {
  await prisma.category.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  await Promise.all([
    prisma.category.update({
      where: {
        id,
      },
      data: {
        deletedAt: createUTCDate(),
      },
    }),
    prisma.transaction.updateMany({
      where: {
        categoryId: id,
      },
      data: {
        categoryId: null,
      },
    }),
    prisma.budgetEntry.deleteMany({
      where: {
        categoryId: id,
      },
    }),
  ]);
};

export default procedure
  .input(DeleteCategoryInput)
  .output(DeleteCategoryOutput)
  .mutation(deleteCategory);
