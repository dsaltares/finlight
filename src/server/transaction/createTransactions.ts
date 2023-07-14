import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateTransactionsInput, CreateTransactionsOutput } from './types';
import { updateAccountBalance } from './utils';

export const createTransactions: Procedure<
  CreateTransactionsInput,
  CreateTransactionsOutput
> = async ({ input: { accountId, transactions: data }, ctx: { session } }) => {
  await prisma.bankAccount.findFirstOrThrow({
    where: {
      id: accountId,
      userId: session?.userId as string,
      deletedAt: null,
    },
  });
  const transactions = await prisma.transaction.createMany({
    data: data.map(({ amount, date, description, categoryId }) => ({
      accountId,
      amount,
      date,
      description,
      categoryId,
    })),
  });
  await updateAccountBalance(accountId);
  return transactions.count;
};

export default procedure
  .input(CreateTransactionsInput)
  .output(CreateTransactionsOutput)
  .mutation(createTransactions);
