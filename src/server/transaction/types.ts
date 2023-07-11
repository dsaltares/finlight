import { z } from 'zod';

export const dateSchema = z.union([z.string(), z.date()]);

export const Transaction = z.object({
  id: z.string(),
  amount: z.number(),
  date: dateSchema,
  description: z.string(),
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
  categoryId: z.string().nullable().optional(),
});
export const UpdateTransactionOutput = Transaction;
export const DeleteTransactionInput = z.object({
  id: z.string(),
});
export const DeleteTransactionOutput = z.void();

export type Transaction = z.infer<typeof Transaction>;
export type GetTransactionsInput = z.infer<typeof GetTransactionsInput>;
export type GetTransactionsOutput = z.infer<typeof GetTransactionsOutput>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionInput>;
export type CreateTransactionOutput = z.infer<typeof CreateTransactionOutput>;
export type CreateTransactionsInput = z.infer<typeof CreateTransactionsInput>;
export type CreateTransactionsOutput = z.infer<typeof CreateTransactionsOutput>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInput>;
export type UpdateTransactionOutput = z.infer<typeof UpdateTransactionOutput>;
export type DeleteTransactionInput = z.infer<typeof DeleteTransactionInput>;
export type DeleteTransactionOutput = z.infer<typeof DeleteTransactionOutput>;
