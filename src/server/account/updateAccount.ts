import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { UpdateAccountInput, UpdateAccountOutput } from './types';

export const updateAccount: Procedure<
  UpdateAccountInput,
  UpdateAccountOutput
> = async ({
  input: { id, name, initialBalance, currency, csvImportPresetId },
  ctx: { session },
}) => {
  await prisma.bankAccount.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  return prisma.bankAccount.update({
    where: {
      id,
    },
    data: {
      name,
      initialBalance,
      currency,
      csvImportPresetId,
      deletedAt: null,
    },
  });
};

export default procedure
  .input(UpdateAccountInput)
  .output(UpdateAccountOutput)
  .mutation(updateAccount);
