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
  await prisma.category.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  await prisma.transaction.updateMany({
    where: {
      categoryId: id,
    },
    data: {
      categoryId: null,
    },
  });
};

export default procedure
  .input(DeleteCategoryInput)
  .output(DeleteCategoryOutput)
  .mutation(deleteCategory);
