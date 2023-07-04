import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { DeleteAccountInput, DeleteAccountOutput } from './types';

export const deleteAccount: Procedure<
  DeleteAccountInput,
  DeleteAccountOutput
> = async ({ input: { id }, ctx: { session } }) => {
  await prisma.bankAccount.findFirstOrThrow({
    where: {
      id,
      userId: session?.userId as string,
    },
  });
  await prisma.bankAccount.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  await prisma.transaction.updateMany({
    where: {
      accountId: id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

export default procedure
  .input(DeleteAccountInput)
  .output(DeleteAccountOutput)
  .mutation(deleteAccount);
