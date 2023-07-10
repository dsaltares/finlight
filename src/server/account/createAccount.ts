import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { CreateAccountInput, CreateAccountOutput } from './types';

export const createAccount: Procedure<
  CreateAccountInput,
  CreateAccountOutput
> = async ({
  input: { name, initialBalance, currency, csvImportPresetId },
  ctx: { session },
}) => {
  const account = await prisma.bankAccount.findFirst({
    where: {
      name,
      userId: session?.userId as string,
      deletedAt: { not: null },
    },
  });

  if (account) {
    return prisma.bankAccount.update({
      where: {
        id: account.id,
      },
      data: {
        name,
        initialBalance,
        balance: initialBalance,
        currency,
        csvImportPresetId,
        deletedAt: null,
      },
    });
  }

  return prisma.bankAccount.create({
    data: {
      name,
      initialBalance,
      balance: initialBalance,
      currency,
      csvImportPresetId,
      userId: session?.userId as string,
    },
  });
};

export default procedure
  .input(CreateAccountInput)
  .output(CreateAccountOutput)
  .mutation(createAccount);
