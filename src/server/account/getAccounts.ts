import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { convertAmount, getRates } from '@server/reports/utils';
import { GetAccountsInput, GetAccountsOutput } from './types';

export const getAccounts: Procedure<
  GetAccountsInput,
  GetAccountsOutput
> = async ({ ctx: { session } }) => {
  const accounts = await prisma.bankAccount.findMany({
    where: {
      userId: session?.userId as string,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const rates = await getRates(
    Array.from(new Set(accounts.map(({ currency }) => currency))),
  );
  return {
    accounts,
    total: {
      value: accounts.reduce(
        (acc, account) =>
          acc + convertAmount(account.balance, account.currency, 'EUR', rates),
        0,
      ),
      currency: 'EUR',
    },
  };
};

export default procedure
  .input(GetAccountsInput)
  .output(GetAccountsOutput)
  .query(getAccounts);
