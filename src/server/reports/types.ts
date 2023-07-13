import { z } from 'zod';
import { TransactionType } from '@server/transaction/types';

export const Date = z.union([z.string(), z.date()]);

export const CategoryAggregate = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

export const GetCategoryReportInput = z.object({
  type: TransactionType,
  from: Date.optional(),
  until: Date.optional(),
  accounts: z.string().array().optional(),
  currency: z.string().optional().default('EUR'),
});
export const GetCategoryReportOutput = CategoryAggregate.array();

export type CategoryAggregate = z.infer<typeof CategoryAggregate>;
export type GetCategoryReportInput = z.infer<typeof GetCategoryReportInput>;
export type GetCategoryReportOutput = z.infer<typeof GetCategoryReportOutput>;
