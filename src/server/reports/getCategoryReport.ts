import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetCategoryReportInput, GetCategoryReportOutput } from './types';
import { type TransactionResult, getRates, convertAmount } from './utils';

export const getCategoryReport: Procedure<
  GetCategoryReportInput,
  GetCategoryReportOutput
> = async ({
  input: { type, from, until, accounts, currency },
  ctx: { session },
}) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      type,
      account: {
        id: accounts ? { in: accounts } : undefined,
        userId: session?.userId as string,
      },
      date: {
        gte: from,
        lte: until,
      },
    },
    include: {
      account: true,
      category: true,
    },
  });
  const rates = await getRates(
    Array.from(
      new Set([
        ...transactions.map((transaction) => transaction.account.currency),
        currency,
      ])
    )
  );
  const transactionsByCategory = transactions.reduce<
    Record<string, TransactionResult[]>
  >((acc, transaction) => {
    const categoryId = transaction.categoryId || 'unknown';
    const transactionsForCategory = acc[categoryId] || [];
    return {
      ...acc,
      [categoryId]: [...transactionsForCategory, transaction],
    };
  }, {});
  return Object.entries(transactionsByCategory)
    .map(([categoryId, transactions]) => ({
      id: categoryId,
      name: transactions[0].category?.name || 'Unknown',
      value: Math.abs(
        transactions.reduce(
          (acc, transaction) =>
            acc +
            convertAmount(
              transaction.amount,
              transaction.account.currency,
              currency,
              rates
            ),
          0
        )
      ),
    }))
    .sort((a, b) => b.value - a.value);
};

export default procedure
  .input(GetCategoryReportInput)
  .output(GetCategoryReportOutput)
  .query(getCategoryReport);
