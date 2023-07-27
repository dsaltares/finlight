import startOfYear from 'date-fns/startOfYear';
import endOfYear from 'date-fns/endOfYear';
import startOfQuarter from 'date-fns/startOfQuarter';
import endOfQuarter from 'date-fns/endOfQuarter';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import type {
  BankAccount,
  BudgetEntryType,
  Category,
  Transaction,
} from '@prisma/client';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { convertAmount, getRates } from '@server/reports/utils';
import { GetBudgetInput, GetBudgetOutput, type TimeGranularity } from './types';
import { ensureBudgetExists } from './utils';

export const getBudget: Procedure<GetBudgetInput, GetBudgetOutput> = async ({
  input: { date = new Date(), granularity = 'Monthly', currency = 'EUR' },
  ctx: { session },
}) => {
  const { from, until } = getDateRange(new Date(date), granularity);
  const multiplier = getGranularityMultiplier(granularity);
  const [budget, transactions, categories] = await Promise.all([
    ensureBudgetExists(session?.userId as string),
    prisma.transaction.findMany({
      where: {
        account: {
          userId: session?.userId as string,
        },
        date: {
          gte: from,
          lte: until,
        },
        type: { not: 'Transfer' },
        deletedAt: null,
      },
      include: { account: true },
    }),
    prisma.category.findMany({
      where: {
        userId: session?.userId as string,
        deletedAt: null,
      },
    }),
  ]);
  const rates = await getRates(
    Array.from(
      new Set(transactions.map((transaction) => transaction.account.currency)),
    ),
  );
  const categoriesById = categories.reduce<Record<string, Category>>(
    (acc, category) => ({ ...acc, [category.id]: category }),
    {},
  );
  const usedCategories = new Set(
    budget.entries.map((entry) => entry.categoryId),
  );
  const missingCategories = categories.filter(
    (category) => !usedCategories.has(category.id),
  );
  return {
    ...budget,
    entries: [
      ...budget.entries.map((entry) => ({
        ...entry,
        categoryName: categoriesById[entry.categoryId].name,
        target: Math.round(multiplier * entry.target * 100) / 100,
        actual: getActualForCategory(
          entry.categoryId,
          entry.type,
          transactions,
          currency,
          rates,
        ),
      })),
      ...missingCategories.map((category) => ({
        type: 'Expense' as const,
        categoryId: category.id,
        categoryName: category.name,
        target: 0,
        actual: getActualForCategory(
          category.id,
          null,
          transactions,
          currency,
          rates,
        ),
      })),
    ],
  };
};

export default procedure
  .input(GetBudgetInput)
  .output(GetBudgetOutput)
  .query(getBudget);

const getDateRange = (date: Date, granularity: TimeGranularity) => {
  switch (granularity) {
    case 'Yearly':
      return {
        from: startOfYear(date),
        until: endOfYear(date),
      };
    case 'Quarterly':
      return {
        from: startOfQuarter(date),
        until: endOfQuarter(date),
      };
    default:
      return {
        from: startOfMonth(date),
        until: endOfMonth(date),
      };
  }
};

const getGranularityMultiplier = (granularity: string) => {
  switch (granularity) {
    case 'Yearly':
      return 12;
    case 'Quarterly':
      return 3;
    default:
      return 1;
  }
};

const getActualForCategory = (
  categoryId: string,
  type: BudgetEntryType | null,
  transactions: (Transaction & { account: BankAccount })[],
  currency: string,
  rates: Record<string, number>,
) =>
  Math.abs(
    transactions
      .filter(
        (transaction) =>
          transaction.categoryId === categoryId &&
          (!type || transaction.type === type),
      )
      .reduce(
        (sum, transaction) =>
          sum +
          convertAmount(
            transaction.amount,
            transaction.account.currency,
            currency,
            rates,
          ),
        0,
      ),
  );
