import { TRPCError } from '@trpc/server';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { DeleteTransactionInput, DeleteTransactionOutput } from './types';
import { updateAccountBalance } from './utils';

export const deleteTransaction: Procedure<
  DeleteTransactionInput,
  DeleteTransactionOutput
> = async ({ input: { id }, ctx: { session } }) => {
  const transaction = await prisma.transaction.findFirstOrThrow({
    where: { id },
    include: { account: true },
  });
  if (transaction.account.userId !== session?.userId) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  await prisma.transaction.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  await updateAccountBalance(transaction.accountId);
};

export default procedure
  .input(DeleteTransactionInput)
  .output(DeleteTransactionOutput)
  .mutation(deleteTransaction);
