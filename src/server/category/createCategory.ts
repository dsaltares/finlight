import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateCategoryInput, CreateCategoryOutput } from './types';

export const createCategory: Procedure<
  CreateCategoryInput,
  CreateCategoryOutput
> = async ({ input: { name }, ctx: { session } }) =>
  prisma.category.create({
    data: {
      name,
      userId: session?.userId as string,
    },
  });

export default procedure
  .input(CreateCategoryInput)
  .output(CreateCategoryOutput)
  .mutation(createCategory);
