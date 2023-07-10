import { z } from 'zod';

export const dateSchema = z.union([z.string(), z.date()]);

export const Account = z.object({
  id: z.string(),
  name: z.string(),
  initialBalance: z.number(),
  balance: z.number(),
  currency: z.string(),
  csvImportPresetId: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const GetAccountsInput = z.void();
export const GetAccountsOutput = z.array(Account);
export const CreateAccountInput = Account.pick({
  name: true,
  initialBalance: true,
  currency: true,
  csvImportPresetId: true,
});
export const CreateAccountOutput = Account;
export const UpdateAccountInput = z.object({
  id: z.string(),
  name: z.string().optional(),
  initialBalance: z.number().optional(),
  currency: z.string().optional(),
  csvImportPresetId: z.string().nullable().optional(),
});
export const UpdateAccountOutput = Account;
export const DeleteAccountInput = z.object({
  id: z.string(),
});
export const DeleteAccountOutput = z.void();

export type Account = z.infer<typeof Account>;
export type GetAccountsInput = z.infer<typeof GetAccountsInput>;
export type GetAccountsOutput = z.infer<typeof GetAccountsOutput>;
export type CreateAccountInput = z.infer<typeof CreateAccountInput>;
export type CreateAccountOutput = z.infer<typeof CreateAccountOutput>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountInput>;
export type UpdateAccountOutput = z.infer<typeof UpdateAccountOutput>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountInput>;
export type DeleteAccountOutput = z.infer<typeof DeleteAccountOutput>;
