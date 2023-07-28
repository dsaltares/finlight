import prisma from '@server/prisma';
import type { TimeGranularity } from './types';

export const ensureBudgetExists = async (userId: string) => {
  const budget = await prisma.budget.findUnique({
    where: {
      userId,
    },
    include: {
      entries: true,
    },
  });
  return (
    budget ||
    prisma.budget.create({
      data: {
        userId,
      },
      include: {
        entries: true,
      },
    })
  );
};

export const granularityToMonthly = (granularity: TimeGranularity) => {
  switch (granularity) {
    case 'Yearly':
      return 1 / 12;
    case 'Quarterly':
      return 1 / 3;
    default:
      return 1.0;
  }
};

export const monthlyToGranularity = (granularity: TimeGranularity) => {
  switch (granularity) {
    case 'Yearly':
      return 12.0;
    case 'Quarterly':
      return 3.0;
    default:
      return 1.0;
  }
};
