import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';
import z from 'zod';
import { categorizeTransactions } from '@/server/ai';
import { db } from '@/server/db';
import { importFile } from '@/server/importFile';
import { rowsToCsv } from '@/server/spreadsheet';
import { getDateWhereFromFilter } from '@/server/trpc/procedures/dateUtils';
import { getUserSettings } from '@/server/trpc/procedures/userSettings';
import { authedProcedure } from '../trpc';
import { updateAccountBalance } from './accounts';
import {
  DateFilterSchema,
  DateSchema,
  type TransactionType,
  TransactionTypeSchema,
  UncategorizedFilterValue,
} from './schema';

export const TransactionSchema = z.object({
  id: z.number(),
  amount: z.number(),
  date: DateSchema,
  description: z.string(),
  type: TransactionTypeSchema,
  categoryId: z.number().nullable(),
  accountId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

const TransactionFilterInput = z.object({
  date: DateFilterSchema.optional(),
  timeZone: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  accounts: z.number().array().optional(),
  type: TransactionTypeSchema.optional(),
  categories: z.number().array().optional(),
  description: z.string().optional(),
});

const listTransactions = authedProcedure
  .input(TransactionFilterInput)
  .output(z.array(TransactionSchema))
  .query(
    async ({
      ctx,
      input: {
        date,
        timeZone,
        minAmount,
        maxAmount,
        accounts,
        type,
        categories,
        description,
      },
    }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      let query = await db
        .selectFrom('account_transaction as t')
        .innerJoin('bank_account', 't.accountId', 'bank_account.id')
        .selectAll('t')
        .where('bank_account.userId', '=', userId)
        .where('t.deletedAt', 'is', null);

      if (accounts && accounts.length > 0) {
        query = query.where('accountId', 'in', accounts);
      }

      const dateFilter = getDateWhereFromFilter({ filter: date, timeZone });
      if (dateFilter.gte) {
        query = query.where('date', '>=', dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where('date', '<=', dateFilter.lte);
      }

      if (minAmount !== undefined) {
        query = query.where('amount', '>=', minAmount);
      }
      if (maxAmount !== undefined) {
        query = query.where('amount', '<=', maxAmount);
      }

      if (type) {
        query = query.where('type', 'is', type);
      }

      if (categories && categories.length > 0) {
        const includeUncategorized = categories.includes(
          UncategorizedFilterValue,
        );
        const categoryIds = categories.filter(
          (id) => id !== UncategorizedFilterValue,
        );
        if (includeUncategorized && categoryIds.length > 0) {
          query = query.where((eb) =>
            eb.or([
              eb('categoryId', 'is', null),
              eb('categoryId', 'in', categoryIds),
            ]),
          );
        } else if (includeUncategorized) {
          query = query.where('categoryId', 'is', null);
        } else {
          query = query.where('categoryId', 'in', categoryIds);
        }
      }

      if (description) {
        query = query.where('description', 'ilike', `%${description}%`);
      }

      return query.$narrowType<{ type: TransactionType }>().execute();
    },
  );

const createTransaction = authedProcedure
  .input(
    TransactionSchema.pick({
      amount: true,
      date: true,
      description: true,
      type: true,
      categoryId: true,
      accountId: true,
    }),
  )
  .output(TransactionSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const account = await db
      .selectFrom('bank_account')
      .selectAll()
      .where('userId', '=', userId)
      .where('id', '=', input.accountId)
      .executeTakeFirst();
    if (!account) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
    }
    const transaction = await db
      .insertInto('account_transaction')
      .values({
        ...input,
        accountId: account.id,
      })
      .returningAll()
      .$narrowType<{ type: TransactionType }>()
      .executeTakeFirstOrThrow();

    await updateAccountBalance(account.id);
    return transaction;
  });

const createTransactions = authedProcedure
  .input(
    z.object({
      accountId: z.number(),
      transactions: z.array(
        TransactionSchema.pick({
          amount: true,
          date: true,
          description: true,
          categoryId: true,
        }),
      ),
    }),
  )
  .output(z.number())
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const account = await db
      .selectFrom('bank_account')
      .selectAll()
      .where('userId', '=', userId)
      .where('id', '=', input.accountId)
      .executeTakeFirst();
    if (!account) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
    }

    const enriched = input.transactions.map((t) => ({
      ...t,
      type: undefined as string | undefined,
    }));
    const settings = await getUserSettings(userId);

    if (settings.aiCategorization) {
      const categories = await db
        .selectFrom('category')
        .select(['id', 'name'])
        .where('userId', '=', userId)
        .where('deletedAt', 'is', null)
        .execute();

      const descriptions = enriched.map((t) => t.description);
      const results = await categorizeTransactions({
        userId,
        descriptions,
        categories,
        user: { email: ctx.user!.email, name: ctx.user!.name },
      });

      for (let i = 0; i < enriched.length; i++) {
        const ai = results[i];
        if (!ai) continue;
        enriched[i].type = ai.type;
        if (enriched[i].categoryId === null && ai.categoryId) {
          enriched[i].categoryId = ai.categoryId;
        }
      }
    }

    const transactions = await db
      .insertInto('account_transaction')
      .values(
        enriched.map((transaction) => ({
          ...transaction,
          accountId: account.id,
        })),
      )
      .returningAll()
      .execute();
    await updateAccountBalance(account.id);
    return transactions.length;
  });

const updateTransaction = authedProcedure
  .input(
    TransactionSchema.pick({
      amount: true,
      date: true,
      description: true,
      type: true,
      categoryId: true,
    })
      .partial()
      .extend({ id: TransactionSchema.shape.id }),
  )
  .output(TransactionSchema)
  .mutation(async ({ ctx, input: { id, ...fields } }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const existing = await db
      .selectFrom('account_transaction')
      .select('accountId')
      .innerJoin(
        'bank_account',
        'account_transaction.accountId',
        'bank_account.id',
      )
      .where('bank_account.userId', '=', userId)
      .where('account_transaction.id', '=', id)
      .where('account_transaction.deletedAt', 'is', null)
      .executeTakeFirst();
    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Transaction not found',
      });
    }
    const transaction = await db
      .updateTable('account_transaction')
      .set(fields)
      .where('id', '=', id)
      .returningAll()
      .$narrowType<{ type: TransactionType }>()
      .executeTakeFirstOrThrow();
    await updateAccountBalance(existing.accountId);
    return transaction;
  });

const updateManyTransactions = authedProcedure
  .input(
    TransactionSchema.pick({
      amount: true,
      date: true,
      description: true,
      type: true,
      categoryId: true,
    })
      .partial()
      .extend({ ids: z.number().array().min(1) }),
  )
  .output(z.number())
  .mutation(async ({ ctx, input: { ids, ...fields } }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const owned = await db
      .selectFrom('account_transaction')
      .select(['account_transaction.id', 'account_transaction.accountId'])
      .innerJoin(
        'bank_account',
        'account_transaction.accountId',
        'bank_account.id',
      )
      .where('bank_account.userId', '=', userId)
      .where('account_transaction.id', 'in', ids)
      .where('account_transaction.deletedAt', 'is', null)
      .execute();
    if (owned.length !== ids.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'One or more transactions not found',
      });
    }
    if (Object.keys(fields).length === 0) {
      return 0;
    }
    await db
      .updateTable('account_transaction')
      .set(fields)
      .where('id', 'in', ids)
      .execute();
    const affectedAccountIds = [...new Set(owned.map((row) => row.accountId))];
    await Promise.all(
      affectedAccountIds.map((accountId) => updateAccountBalance(accountId)),
    );
    return owned.length;
  });

const deleteTransaction = authedProcedure
  .input(z.object({ id: z.number() }))
  .output(z.void())
  .mutation(async ({ ctx, input: { id } }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const existing = await db
      .selectFrom('account_transaction')
      .select('accountId')
      .innerJoin(
        'bank_account',
        'account_transaction.accountId',
        'bank_account.id',
      )
      .where('bank_account.userId', '=', userId)
      .where('account_transaction.id', '=', id)
      .where('account_transaction.deletedAt', 'is', null)
      .executeTakeFirst();
    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Transaction not found',
      });
    }
    await db
      .updateTable('account_transaction')
      .set({ deletedAt: new Date().toISOString() })
      .where('id', '=', id)
      .execute();
    await updateAccountBalance(existing.accountId);
  });

const deleteManyTransactions = authedProcedure
  .input(z.object({ ids: z.number().array().min(1) }))
  .output(z.number())
  .mutation(async ({ ctx, input: { ids } }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const owned = await db
      .selectFrom('account_transaction')
      .select(['account_transaction.id', 'account_transaction.accountId'])
      .innerJoin(
        'bank_account',
        'account_transaction.accountId',
        'bank_account.id',
      )
      .where('bank_account.userId', '=', userId)
      .where('account_transaction.id', 'in', ids)
      .where('account_transaction.deletedAt', 'is', null)
      .execute();
    if (owned.length !== ids.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'One or more transactions not found',
      });
    }
    await db
      .updateTable('account_transaction')
      .set({ deletedAt: new Date().toISOString() })
      .where('id', 'in', ids)
      .execute();
    const affectedAccountIds = [...new Set(owned.map((row) => row.accountId))];
    await Promise.all(
      affectedAccountIds.map((accountId) => updateAccountBalance(accountId)),
    );
    return owned.length;
  });

const importTransactions = authedProcedure
  .input(
    z.object({
      accountId: z.number(),
      fileBase64: z.string().max(14_000_000),
      fileName: z.string(),
    }),
  )
  .output(z.number())
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const account = await db
      .selectFrom('bank_account')
      .selectAll()
      .where('userId', '=', userId)
      .where('id', '=', input.accountId)
      .executeTakeFirst();
    if (!account) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
    }

    const categories = await db
      .selectFrom('category')
      .select(['id', 'name', 'importPatterns'])
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .execute();

    const preset = account.csvImportPresetId
      ? ((await db
          .selectFrom('csv_import_preset')
          .selectAll()
          .where('id', '=', account.csvImportPresetId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst()) ?? null)
      : null;

    const parsed = await importFile({
      userId,
      fileBase64: input.fileBase64,
      fileName: input.fileName,
      currency: account.currency,
      preset,
      categories,
    });

    const enriched = parsed.map((t) => ({
      ...t,
      type: undefined as string | undefined,
    }));
    const settings = await getUserSettings(userId);

    if (settings.aiCategorization) {
      const descriptions = enriched.map((t) => t.description);
      const results = await categorizeTransactions({
        userId,
        descriptions,
        categories,
        user: { email: ctx.user!.email, name: ctx.user!.name },
      });

      for (let i = 0; i < enriched.length; i++) {
        const ai = results[i];
        if (!ai) continue;
        enriched[i].type = ai.type;
        if (enriched[i].categoryId === null && ai.categoryId) {
          enriched[i].categoryId = ai.categoryId;
        }
      }
    }

    const transactions = await db
      .insertInto('account_transaction')
      .values(
        enriched.map((transaction) => ({
          ...transaction,
          accountId: account.id,
        })),
      )
      .returningAll()
      .execute();
    await updateAccountBalance(account.id);
    return transactions.length;
  });

const exportTransactions = authedProcedure
  .input(TransactionFilterInput)
  .output(z.string())
  .mutation(
    async ({
      ctx,
      input: {
        date,
        timeZone,
        minAmount,
        maxAmount,
        accounts,
        type,
        categories,
        description,
      },
    }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      let query = await db
        .selectFrom('account_transaction as t')
        .innerJoin('bank_account', 't.accountId', 'bank_account.id')
        .select([
          't.id',
          't.amount',
          't.date',
          't.description',
          't.type',
          't.categoryId',
          't.accountId',
          'bank_account.name as accountName',
          'bank_account.currency',
        ])
        .where('bank_account.userId', '=', userId)
        .where('t.deletedAt', 'is', null);

      if (accounts && accounts.length > 0) {
        query = query.where('accountId', 'in', accounts);
      }

      const dateFilter = getDateWhereFromFilter({ filter: date, timeZone });
      if (dateFilter.gte) {
        query = query.where('date', '>=', dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where('date', '<=', dateFilter.lte);
      }

      if (minAmount !== undefined) {
        query = query.where('amount', '>=', minAmount);
      }
      if (maxAmount !== undefined) {
        query = query.where('amount', '<=', maxAmount);
      }

      if (type) {
        query = query.where('type', 'is', type);
      }

      if (categories && categories.length > 0) {
        const includeUncategorized = categories.includes(
          UncategorizedFilterValue,
        );
        const categoryIds = categories.filter(
          (id) => id !== UncategorizedFilterValue,
        );
        if (includeUncategorized && categoryIds.length > 0) {
          query = query.where((eb) =>
            eb.or([
              eb('categoryId', 'is', null),
              eb('categoryId', 'in', categoryIds),
            ]),
          );
        } else if (includeUncategorized) {
          query = query.where('categoryId', 'is', null);
        } else {
          query = query.where('categoryId', 'in', categoryIds);
        }
      }

      if (description) {
        query = query.where('description', 'ilike', `%${description}%`);
      }

      const filteredIds = (await query.select('t.id').execute()).map(
        (r) => r.id,
      );

      if (filteredIds.length === 0) {
        return '';
      }

      const accountIds = [
        ...new Set(
          (
            await db
              .selectFrom('account_transaction')
              .select('accountId')
              .where('id', 'in', filteredIds)
              .groupBy('accountId')
              .execute()
          ).map((r) => r.accountId),
        ),
      ];

      const rows = await db
        .with('running_balance', (qb) =>
          qb
            .selectFrom('account_transaction as t')
            .innerJoin('bank_account as a', 't.accountId', 'a.id')
            .select([
              't.id',
              sql<number>`a.initialBalance + sum(t.amount) over (partition by t.accountId order by t.date asc, t.id asc)`.as(
                'balance',
              ),
            ])
            .where('t.deletedAt', 'is', null)
            .where('t.accountId', 'in', accountIds),
        )
        .selectFrom('account_transaction as t')
        .innerJoin('bank_account as a', 't.accountId', 'a.id')
        .innerJoin('running_balance as rb', 't.id', 'rb.id')
        .leftJoin('category as c', 't.categoryId', 'c.id')
        .select([
          't.date',
          'a.name as accountName',
          'a.currency',
          't.amount',
          'rb.balance',
          't.type',
          'c.name as categoryName',
          't.description',
        ])
        .where('t.id', 'in', filteredIds)
        .orderBy('t.date', 'asc')
        .orderBy('t.id', 'asc')
        .execute();

      const header = [
        'Date',
        'Account',
        'Currency',
        'Amount',
        'Balance',
        'Type',
        'Category',
        'Description',
      ];
      const csvRows = [
        header,
        ...rows.map((t) => [
          t.date,
          t.accountName,
          t.currency,
          (t.amount / 100).toFixed(2),
          (t.balance / 100).toFixed(2),
          t.type,
          t.categoryName ?? '',
          t.description,
        ]),
      ];

      return rowsToCsv({ rows: csvRows });
    },
  );

export default {
  list: listTransactions,
  create: createTransaction,
  createMany: createTransactions,
  update: updateTransaction,
  updateMany: updateManyTransactions,
  delete: deleteTransaction,
  deleteMany: deleteManyTransactions,
  importFile: importTransactions,
  export: exportTransactions,
};
