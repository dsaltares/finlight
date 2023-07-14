import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { UpdateCategoryInput, UpdateCategoryOutput } from './types';

export const updateCategory: Procedure<
  UpdateCategoryInput,
  UpdateCategoryOutput
> = async ({ input: { id, name, importPatterns }, ctx: { session } }) => {
  await prisma.category.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
      importPatterns,
      deletedAt: null,
    },
  });
};

export default procedure
  .input(UpdateCategoryInput)
  .output(UpdateCategoryOutput)
  .mutation(updateCategory);
