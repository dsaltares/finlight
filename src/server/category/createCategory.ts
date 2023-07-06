import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateCategoryInput, CreateCategoryOutput } from './types';

export const createCategory: Procedure<
  CreateCategoryInput,
  CreateCategoryOutput
> = async ({ input: { name }, ctx: { session } }) => {
  const category = await prisma.category.findFirst({
    where: {
      name,
      userId: session?.userId as string,
      deletedAt: { not: null },
    },
  });

  if (category) {
    return prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  return prisma.category.create({
    data: {
      name,
      userId: session?.userId as string,
    },
  });
};

export default procedure
  .input(CreateCategoryInput)
  .output(CreateCategoryOutput)
  .mutation(createCategory);
