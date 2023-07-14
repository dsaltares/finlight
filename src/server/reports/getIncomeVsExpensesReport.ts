import format from 'date-fns/format';
import groupBy from 'lodash.groupby';
import parse from 'date-fns/parse';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import {
  GetIncomeVsExpensesReportInput,
  GetIncomeVsExpensesReportOutput,
} from './types';
import {
  getRates,
  convertTransactionAmount,
  getFormatForGranularity,
  getDisplayFormatForGranularity,
} from './utils';

export const getIncomeVsExpensesReport: Procedure<
  GetIncomeVsExpensesReportInput,
  GetIncomeVsExpensesReportOutput
> = async ({
  input: { from, until, accounts, currency, granularity },
  ctx: { session },
}) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      type: { not: 'Transfer' },
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
      new Set(transactions.map((transaction) => transaction.account.currency))
    )
  );
  const dateFormat = getFormatForGranularity(granularity);
  const buckets = groupBy(transactions, (transaction) =>
    format(transaction.date, dateFormat)
  );
  return Object.keys(buckets)
    .sort()
    .map((bucketKey) => {
      const bucket = buckets[bucketKey];
      return {
        bucket: format(
          parse(bucketKey, dateFormat, new Date()),
          getDisplayFormatForGranularity(granularity)
        ),
        income: bucket
          .filter((transaction) => transaction.type === 'Income')
          .reduce(
            (acc, transaction) =>
              acc +
              convertTransactionAmount(
                transaction.amount,
                transaction.account.currency,
                currency,
                rates
              ),
            0
          ),
        expenses: bucket
          .filter((transaction) => transaction.type === 'Expense')
          .reduce(
            (acc, transaction) =>
              acc -
              convertTransactionAmount(
                transaction.amount,
                transaction.account.currency,
                currency,
                rates
              ),
            0
          ),
      };
    });
};

export default procedure
  .input(GetIncomeVsExpensesReportInput)
  .output(GetIncomeVsExpensesReportOutput)
  .query(getIncomeVsExpensesReport);
