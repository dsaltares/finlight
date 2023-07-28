import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { convertAmount, getRates } from '@server/reports/utils';
import { UpdateBudgetInput, UpdateBudgetOutput } from './types';
import { ensureBudgetExists } from './utils';

export const updateBudget: Procedure<
  UpdateBudgetInput,
  UpdateBudgetOutput
> = async ({
  input: { granularity, currency = 'EUR', entries },
  ctx: { session },
}) => {
  const [budget, rates] = await Promise.all([
    ensureBudgetExists(session?.userId as string),
    getRates([currency]),
  ]);
  const desiredGranularity = granularity || budget.granularity;
  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      granularity: desiredGranularity,
      entries: {
        deleteMany: {},
        createMany: {
          data: entries.map((entry) => ({
            categoryId: entry.categoryId,
            type: entry.type,
            target: convertAmount(entry.target, currency, 'EUR', rates),
          })),
        },
      },
    },
  });
};

export default procedure
  .input(UpdateBudgetInput)
  .output(UpdateBudgetOutput)
  .mutation(updateBudget);
