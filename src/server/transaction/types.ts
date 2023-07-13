import { z } from 'zod';

export const dateSchema = z.union([z.string(), z.date()]);

export const TransactionTypes = ['Income', 'Expense', 'Transfer'] as const;
export const TransactionType = z.enum(TransactionTypes);

export const Transaction = z.object({
  id: z.string(),
  amount: z.number(),
  date: dateSchema,
  description: z.string(),
  type: TransactionType,
  categoryId: z.string().nullable(),
  accountId: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const GetTransactionsInput = z.object({
  accountId: z.string().optional(),
});
export const GetTransactionsOutput = z.array(Transaction);
export const CreateTransactionInput = Transaction.pick({
  amount: true,
  date: true,
  description: true,
  type: true,
  categoryId: true,
  accountId: true,
});
export const CreateTransactionOutput = Transaction;
export const CreateTransactionsInput = z.object({
  accountId: z.string(),
  transactions: Transaction.pick({
    amount: true,
    date: true,
    description: true,
  }).array(),
});
export const CreateTransactionsOutput = z.number();
export const UpdateTransactionInput = z.object({
  id: z.string(),
  amount: z.number().optional(),
  date: dateSchema.optional(),
  description: z.string().optional(),
  type: TransactionType.optional(),
  categoryId: z.string().nullable().optional(),
});
export const UpdateTransactionOutput = Transaction;
export const UpdateTransactionsInput = z.object({
  ids: z.string().array(),
  amount: z.number().optional(),
  date: dateSchema.optional(),
  description: z.string().optional(),
  type: TransactionType.optional(),
  categoryId: z.string().nullable().optional(),
});
export const UpdateTransactionsOutput = z.void();
export const DeleteTransactionsInput = z.object({
  ids: z.string().array(),
});
export const DeleteTransactionsOutput = z.void();

export type TransactionType = z.infer<typeof TransactionType>;
export type Transaction = z.infer<typeof Transaction>;
export type GetTransactionsInput = z.infer<typeof GetTransactionsInput>;
export type GetTransactionsOutput = z.infer<typeof GetTransactionsOutput>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionInput>;
export type CreateTransactionOutput = z.infer<typeof CreateTransactionOutput>;
export type CreateTransactionsInput = z.infer<typeof CreateTransactionsInput>;
export type CreateTransactionsOutput = z.infer<typeof CreateTransactionsOutput>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInput>;
export type UpdateTransactionOutput = z.infer<typeof UpdateTransactionOutput>;
export type UpdateTransactionsInput = z.infer<typeof UpdateTransactionsInput>;
export type UpdateTransactionsOutput = z.infer<typeof UpdateTransactionsOutput>;
export type DeleteTransactionsInput = z.infer<typeof DeleteTransactionsInput>;
export type DeleteTransactionsOutput = z.infer<typeof DeleteTransactionsOutput>;
