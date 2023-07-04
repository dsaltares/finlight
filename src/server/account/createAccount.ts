import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateAccountInput, CreateAccountOutput } from './types';

export const createAccount: Procedure<
  CreateAccountInput,
  CreateAccountOutput
> = async ({ input: { name, initialBalance, currency }, ctx: { session } }) =>
  prisma.bankAccount.create({
    data: {
      name,
      initialBalance,
      currency,
      userId: session?.userId as string,
    },
  });

export default procedure
  .input(CreateAccountInput)
  .output(CreateAccountOutput)
  .mutation(createAccount);
