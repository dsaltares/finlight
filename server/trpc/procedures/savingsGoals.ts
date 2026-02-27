import { TRPCError } from '@trpc/server';
import z from 'zod';
import { convertAmount, getRates } from '@/server/currency';
import { db } from '@/server/db';
import { authedProcedure } from '@/server/trpc/trpc';
import { DateSchema } from './schema';
import { getUserDefaultCurrency } from './userSettings';

const SavingsGoalSchema = z.object({
  id: z.number(),
  name: z.string(),
  targetAmount: z.number().int(),
  currency: z.string(),
  startDate: z.string().nullable(),
  deadline: z.string().nullable(),
  completedAt: z.string().nullable(),
  accountIds: z.array(z.number()),
  currentAmount: z.number().int(),
  percentage: z.number(),
  expectedAmount: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

type ComputeExpectedAmountArgs = {
  startDate: string | null;
  deadline: string | null;
  targetAmount: number;
};

function computeExpectedAmount({
  startDate,
  deadline,
  targetAmount,
}: ComputeExpectedAmountArgs): number | null {
  if (!startDate || !deadline) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  if (end <= start) return null;
  const elapsed = Math.max(0, Math.min(now - start, end - start));
  return Math.round((elapsed / (end - start)) * targetAmount);
}

const list = authedProcedure
  .input(
    z.object({
      includeCompleted: z.boolean().optional(),
    }),
  )
  .output(z.array(SavingsGoalSchema))
  .query(async ({ ctx, input }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    let query = db
      .selectFrom('savings_goal')
      .selectAll()
      .where('userId', '=', ctx.user.id)
      .where('deletedAt', 'is', null);

    if (!input.includeCompleted) {
      query = query.where('completedAt', 'is', null);
    }

    const goals = await query.orderBy('createdAt', 'desc').execute();

    const goalAccounts = await db
      .selectFrom('savings_goal_account')
      .innerJoin('savings_goal', 'savings_goal.id', 'savings_goal_account.goalId')
      .select([
        'savings_goal_account.goalId',
        'savings_goal_account.accountId',
      ])
      .where('savings_goal.userId', '=', ctx.user.id)
      .where('savings_goal.deletedAt', 'is', null)
      .execute();

    const allAccounts = await db
      .selectFrom('bank_account')
      .select(['id', 'balance', 'currency'])
      .where('userId', '=', ctx.user.id)
      .where('deletedAt', 'is', null)
      .execute();

    const accountsById = new Map(allAccounts.map((a) => [a.id, a]));

    const goalAccountMap = new Map<number, number[]>();
    for (const ga of goalAccounts) {
      const existing = goalAccountMap.get(ga.goalId) ?? [];
      existing.push(ga.accountId);
      goalAccountMap.set(ga.goalId, existing);
    }

    const allCurrencies = [
      ...goals.map((g) => g.currency),
      ...allAccounts.map((a) => a.currency),
    ];
    const baseCurrency = await getUserDefaultCurrency(ctx.user.id);
    const rates = await getRates([baseCurrency, ...allCurrencies]);

    return goals.map((goal) => {
      const goalLinkedIds = goalAccountMap.get(goal.id) ?? [];
      const relevantAccounts =
        goalLinkedIds.length > 0
          ? goalLinkedIds.flatMap((id) => {
              const a = accountsById.get(id);
              return a ? [a] : [];
            })
          : allAccounts;
      const currentAmount = relevantAccounts.reduce(
        (sum, account) =>
          sum +
          convertAmount(account.balance, account.currency, goal.currency, rates),
        0,
      );
      const percentage =
        goal.targetAmount > 0
          ? Math.min(currentAmount / goal.targetAmount, 1)
          : 0;

      const expectedAmount = computeExpectedAmount({
        startDate: goal.startDate,
        deadline: goal.deadline,
        targetAmount: goal.targetAmount,
      });

      return {
        ...goal,
        accountIds: goalLinkedIds,
        currentAmount,
        percentage,
        expectedAmount,
      };
    });
  });

const create = authedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      targetAmount: z.number().int().positive(),
      currency: z.string(),
      startDate: DateSchema.nullable().optional(),
      deadline: DateSchema.nullable().optional(),
      accountIds: z.array(z.number()).optional(),
    }),
  )
  .output(SavingsGoalSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return db.transaction().execute(async (trx) => {
      const goal = await trx
        .insertInto('savings_goal')
        .values({
          userId: ctx.user!.id,
          name: input.name,
          targetAmount: input.targetAmount,
          currency: input.currency,
          startDate: input.startDate ?? null,
          deadline: input.deadline ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const accountIds = input.accountIds ?? [];
      if (accountIds.length > 0) {
        await trx
          .insertInto('savings_goal_account')
          .values(
            accountIds.map((accountId) => ({
              goalId: goal.id,
              accountId,
            })),
          )
          .execute();
      }

      return {
        ...goal,
        accountIds,
        currentAmount: 0,
        percentage: 0,
        expectedAmount: computeExpectedAmount({
          startDate: goal.startDate,
          deadline: goal.deadline,
          targetAmount: goal.targetAmount,
        }),
      };
    });
  });

const update = authedProcedure
  .input(
    z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      targetAmount: z.number().int().positive().optional(),
      currency: z.string().optional(),
      startDate: DateSchema.nullable().optional(),
      deadline: DateSchema.nullable().optional(),
      accountIds: z.array(z.number()).optional(),
    }),
  )
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    await db.transaction().execute(async (trx) => {
      const { id, accountIds, ...fields } = input;
      const updateFields: Record<string, unknown> = {};
      if (fields.name !== undefined) updateFields.name = fields.name;
      if (fields.targetAmount !== undefined)
        updateFields.targetAmount = fields.targetAmount;
      if (fields.currency !== undefined) updateFields.currency = fields.currency;
      if (fields.startDate !== undefined)
        updateFields.startDate = fields.startDate;
      if (fields.deadline !== undefined)
        updateFields.deadline = fields.deadline;

      if (Object.keys(updateFields).length > 0) {
        await trx
          .updateTable('savings_goal')
          .set(updateFields)
          .where('id', '=', id)
          .where('userId', '=', ctx.user!.id)
          .where('deletedAt', 'is', null)
          .execute();
      }

      if (accountIds !== undefined) {
        await trx
          .deleteFrom('savings_goal_account')
          .where('goalId', '=', id)
          .execute();
        if (accountIds.length > 0) {
          await trx
            .insertInto('savings_goal_account')
            .values(
              accountIds.map((accountId) => ({
                goalId: id,
                accountId,
              })),
            )
            .execute();
        }
      }
    });
  });

const deleteGoal = authedProcedure
  .input(z.object({ id: z.number() }))
  .output(z.void())
  .mutation(async ({ ctx, input: { id } }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    await db
      .updateTable('savings_goal')
      .set({ deletedAt: new Date().toISOString() })
      .where('userId', '=', ctx.user.id)
      .where('id', '=', id)
      .execute();
  });

const complete = authedProcedure
  .input(z.object({ id: z.number(), completed: z.boolean() }))
  .output(z.void())
  .mutation(async ({ ctx, input: { id, completed } }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    await db
      .updateTable('savings_goal')
      .set({ completedAt: completed ? new Date().toISOString() : null })
      .where('userId', '=', ctx.user.id)
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .execute();
  });

export default {
  list,
  create,
  update,
  delete: deleteGoal,
  complete,
};
