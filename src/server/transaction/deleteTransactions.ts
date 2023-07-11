import { TRPCError } from '@trpc/server';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { DeleteTransactionsInput, DeleteTransactionsOutput } from './types';
import { updateAccountBalance } from './utils';

export const deleteTransaction: Procedure<
  DeleteTransactionsInput,
  DeleteTransactionsOutput
> = async ({ input: { ids }, ctx: { session } }) => {
  const transactions = await prisma.transaction.findMany({
    where: { id: { in: ids } },
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
      deletedAt: new Date(),
    },
  });
  await updateAccountBalance(transactions[0].accountId);
};

export default procedure
  .input(DeleteTransactionsInput)
  .output(DeleteTransactionsOutput)
  .mutation(deleteTransaction);
