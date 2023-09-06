import createUTCDate from '@lib/createUTCDate';
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
      deletedAt: createUTCDate(),
    },
  });
  await prisma.transaction.updateMany({
    where: {
      accountId: id,
    },
    data: {
      deletedAt: createUTCDate(),
    },
  });
};

export default procedure
  .input(DeleteAccountInput)
  .output(DeleteAccountOutput)
  .mutation(deleteAccount);
