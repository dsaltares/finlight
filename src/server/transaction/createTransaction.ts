import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateTransactionInput, CreateTransactionOutput } from './types';
import { updateAccountBalance } from './utils';

export const createTransaction: Procedure<
  CreateTransactionInput,
  CreateTransactionOutput
> = async ({
  input: { amount, date, description, accountId, type, categoryId },
  ctx: { session },
}) => {
  await prisma.bankAccount.findFirstOrThrow({
    where: {
      id: accountId,
      userId: session?.userId as string,
      deletedAt: null,
    },
  });
  const transaction = await prisma.transaction.create({
    data: {
      amount,
      date,
      description,
      accountId,
      type,
      categoryId,
    },
  });
  await updateAccountBalance(accountId);
  return transaction;
};

export default procedure
  .input(CreateTransactionInput)
  .output(CreateTransactionOutput)
  .mutation(createTransaction);
