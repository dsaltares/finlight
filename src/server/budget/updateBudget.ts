import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { convertAmount, getRates } from '@server/reports/utils';
import { UpdateBudgetInput, UpdateBudgetOutput } from './types';
import { ensureBudgetExists } from './utils';

export const updateBudget: Procedure<
  UpdateBudgetInput,
  UpdateBudgetOutput
> = async ({
  input: { granularity = 'Monthly', currency = 'EUR', entries },
  ctx: { session },
}) => {
  const [budget, rates] = await Promise.all([
    ensureBudgetExists(session?.userId as string),
    getRates([currency]),
  ]);
  const multiplier = getGranularityMultiplier(granularity);
  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      entries: {
        deleteMany: {},
        createMany: {
          data: entries.map((entry) => ({
            categoryId: entry.categoryId,
            type: entry.type,
            target: convertAmount(
              Math.round(multiplier * entry.target * 100) / 100,
              currency,
              'EUR',
              rates,
            ),
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

const getGranularityMultiplier = (granularity: string) => {
  switch (granularity) {
    case 'Yearly':
      return 1 / 12;
    case 'Quarterly':
      return 1 / 3;
    default:
      return 1.0;
  }
};
