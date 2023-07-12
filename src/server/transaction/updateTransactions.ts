import { TRPCError } from '@trpc/server';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { UpdateTransactionsInput, UpdateTransactionsOutput } from './types';
import { updateAccountBalance } from './utils';

export const updateTransactions: Procedure<
  UpdateTransactionsInput,
  UpdateTransactionsOutput
> = async ({
  input: { ids, amount, date, categoryId, description },
  ctx: { session },
}) => {
  const transactions = await prisma.transaction.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: { account: true },
  });

  if (transactions.length === 0) {
    return;
  }

  for (const transaction of transactions) {
    if (transaction.account.userId !== session?.userId) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
  }

  await prisma.transaction.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      amount,
      date,
      categoryId,
      description,
      deletedAt: null,
    },
  });
  await updateAccountBalance(transactions[0].accountId);
};

export default procedure
  .input(UpdateTransactionsInput)
  .output(UpdateTransactionsOutput)
  .mutation(updateTransactions);
