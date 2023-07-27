import prisma from '@server/prisma';

export const ensureBudgetExists = async (userId: string) => {
  const budget = await prisma.budget.findUnique({
    where: {
      userId,
    },
    include: {
      entries: true,
    },
  });
  return (
    budget ||
    prisma.budget.create({
      data: {
        userId,
      },
      include: {
        entries: true,
      },
    })
  );
};
