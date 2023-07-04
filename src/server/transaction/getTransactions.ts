import { TRPCError } from '@trpc/server';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetTransactionsInput, GetTransactionsOutput } from './types';

export const getTransactions: Procedure<
  GetTransactionsInput,
  GetTransactionsOutput
> = async ({ input: { accountId }, ctx: { session } }) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session?.userId as string, deletedAt: null },
  });
  const accountIds = accounts.map((account) => account.id);
  if (accountId && !accountIds.includes(accountId)) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return prisma.transaction.findMany({
    where: {
      accountId: accountId ? accountId : { in: accountIds },
      deletedAt: null,
    },
  });
};

export default procedure
  .input(GetTransactionsInput)
  .output(GetTransactionsOutput)
  .query(getTransactions);
