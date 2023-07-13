import { TRPCError } from '@trpc/server';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { UpdateTransactionInput, UpdateTransactionOutput } from './types';
import { updateAccountBalance } from './utils';

export const updateTransaction: Procedure<
  UpdateTransactionInput,
  UpdateTransactionOutput
> = async ({
  input: { id, amount, date, type, categoryId, description },
  ctx: { session },
}) => {
  const transaction = await prisma.transaction.findFirstOrThrow({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      account: true,
    },
  });
  if (transaction.account.userId !== session?.userId) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: { amount, date, type, categoryId, description },
  });
  await updateAccountBalance(transaction.accountId);
  return updatedTransaction;
};

export default procedure
  .input(UpdateTransactionInput)
  .output(UpdateTransactionOutput)
  .mutation(updateTransaction);
