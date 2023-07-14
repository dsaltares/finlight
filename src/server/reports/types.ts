import { z } from 'zod';
import { TransactionType } from '@server/transaction/types';

export const Date = z.union([z.string(), z.date()]);
export const TimeGranularities = ['Monthly', 'Quarterly', 'Yearly'] as const;
export const TimeGranularity = z.enum(TimeGranularities);
export const CategoryAggregate = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});
export const IncomeVsExpensesBucket = z.object({
  bucket: z.string(),
  income: z.number(),
  expenses: z.number(),
});
export const AccountPositionsBucket = z.object({
  bucket: z.string(),
  positions: z.record(z.number()),
  total: z.number(),
});

export const GetCategoryReportInput = z.object({
  type: TransactionType,
  from: Date.optional(),
  until: Date.optional(),
  accounts: z.string().array().optional(),
  currency: z.string().optional().default('EUR'),
});
export const GetCategoryReportOutput = CategoryAggregate.array();
export const GetIncomeVsExpensesReportInput = z.object({
  from: Date.optional(),
  until: Date.optional(),
  accounts: z.string().array().optional(),
  currency: z.string().optional().default('EUR'),
  granularity: TimeGranularity.optional().default('Monthly'),
});
export const GetIncomeVsExpensesReportOutput = IncomeVsExpensesBucket.array();
export const GetAccountPositionsReportInput = z.object({
  from: Date.optional(),
  until: Date.optional(),
  accounts: z.string().array().optional(),
  currency: z.string().optional().default('EUR'),
  granularity: TimeGranularity.optional().default('Monthly'),
});
export const GetAccountPositionsReportOutput = AccountPositionsBucket.array();

export type TimeGranularity = z.infer<typeof TimeGranularity>;
export type CategoryAggregate = z.infer<typeof CategoryAggregate>;
export type IncomeVsExpensesBucket = z.infer<typeof IncomeVsExpensesBucket>;
export type AccountPositionsBucket = z.infer<typeof AccountPositionsBucket>;
export type GetCategoryReportInput = z.infer<typeof GetCategoryReportInput>;
export type GetCategoryReportOutput = z.infer<typeof GetCategoryReportOutput>;
export type GetIncomeVsExpensesReportInput = z.infer<
  typeof GetIncomeVsExpensesReportInput
>;
export type GetIncomeVsExpensesReportOutput = z.infer<
  typeof GetIncomeVsExpensesReportOutput
>;
export type GetAccountPositionsReportInput = z.infer<
  typeof GetAccountPositionsReportInput
>;
export type GetAccountPositionsReportOutput = z.infer<
  typeof GetAccountPositionsReportOutput
>;