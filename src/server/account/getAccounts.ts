import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { GetAccountsInput, GetAccountsOutput } from './types';

export const getAccounts: Procedure<
  GetAccountsInput,
  GetAccountsOutput
> = async ({ ctx: { session } }) =>
  prisma.bankAccount.findMany({
    where: {
      userId: session?.userId as string,
      deletedAt: null,
    },
  });

export default procedure
  .input(GetAccountsInput)
  .output(GetAccountsOutput)
  .query(getAccounts);
