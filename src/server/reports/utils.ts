import type { BankAccount, Category, Transaction } from '@prisma/client';
import prisma from '@server/prisma';
import type { TimeGranularity } from './types';

export type RatesByCurrency = Record<string, number>;

export const getRates = async (currencies: string[]) => {
  const rates = await Promise.all(
    currencies.map(async (currency) => {
      if (currency === 'EUR') {
        return Promise.resolve({ currency, rate: 1 });
      }
      const rate = await prisma.exchangeRate.findFirst({
        where: {
          ticker: `EUR${currency}`,
        },
        orderBy: {
          date: 'desc',
        },
      });
      return rate
        ? {
            currency,
            rate: rate.close,
          }
        : {
            currency,
            rate: 1,
          };
    })
  );
  return rates.reduce<RatesByCurrency>(
    (acc, rate) => ({ ...acc, [rate.currency]: rate.rate }),
    {}
  );
};

export type TransactionResult = Transaction & {
  account: BankAccount;
  category: Category | null;
};

export const convertTransactionAmount = (
  amount: number,
  currency: string,
  targetCurrency: string,
  rates: RatesByCurrency
) => {
  // To do RON -> USD
  // baseToTarget: EUR -> USD
  // baseToTransaction: EUR -> RON
  const baseToTarget = rates[targetCurrency] || 1;
  const baseToTransaction = rates[currency] || 1;
  return (amount * baseToTarget) / baseToTransaction;
};

export const getFormatForGranularity = (granularity: TimeGranularity) => {
  switch (granularity) {
    case 'Daily':
      return 'yyyy-MM-dd';
    case 'Monthly':
      return 'yyyy-MM';
    case 'Quarterly':
      return 'yyyy-qqq';
    case 'Yearly':
      return 'yyyy';
    default:
      return 'yyyy-MM-dd';
  }
};

export const getDisplayFormatForGranularity = (
  granularity: TimeGranularity
) => {
  switch (granularity) {
    case 'Daily':
      return 'dd MMM yyyy';
    case 'Monthly':
      return 'MMM yyyy';
    case 'Quarterly':
      return 'qqq yyyy';
    case 'Yearly':
      return 'yyyy';
    default:
      return 'dd MMM yyyy';
  }
};
