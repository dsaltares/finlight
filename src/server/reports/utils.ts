import type { BankAccount, Category, Transaction } from '@prisma/client';
import prisma from '@server/prisma';

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
