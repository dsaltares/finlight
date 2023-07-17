import prisma from '@server/prisma';

export const updateAccountBalance = async (accountId: string) => {
  const account = await prisma.bankAccount.findFirstOrThrow({
    where: { id: accountId },
  });
  const transactions = await prisma.transaction.findMany({
    where: { accountId, deletedAt: null },
  });
  return prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      balance:
        Math.round(
          transactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            account.initialBalance
          ) * 100
        ) / 100,
    },
  });
};
