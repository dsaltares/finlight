import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetTransactionsInput, GetTransactionsOutput } from './types';

export const getTransactions: Procedure<
  GetTransactionsInput,
  GetTransactionsOutput
> = async ({
  input: {
    from,
    until,
    minAmount,
    maxAmount,
    accountId,
    type,
    categoryId,
    description,
  },
  ctx: { session },
}) =>
  prisma.transaction.findMany({
    where: {
      account: {
        userId: session?.userId as string,
      },
      date: {
        gte: from,
        lte: until,
      },
      amount: {
        gte: minAmount,
        lte: maxAmount,
      },
      accountId,
      type,
      categoryId,
      description: description
        ? {
            contains: description,
            mode: 'insensitive',
          }
        : undefined,
      deletedAt: null,
    },
  });

export default procedure
  .input(GetTransactionsInput)
  .output(GetTransactionsOutput)
  .query(getTransactions);
