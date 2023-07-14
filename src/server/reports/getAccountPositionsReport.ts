import format from 'date-fns/format';
import groupBy from 'lodash.groupby';
import parse from 'date-fns/parse';
import type { BankAccount } from '@prisma/client';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import {
  type AccountPositionsBucket,
  GetAccountPositionsReportInput,
  GetAccountPositionsReportOutput,
} from './types';
import {
  getRates,
  convertTransactionAmount,
  getFormatForGranularity,
  getDisplayFormatForGranularity,
} from './utils';

export const getAccountPositionsReport: Procedure<
  GetAccountPositionsReportInput,
  GetAccountPositionsReportOutput
> = async ({
  input: { from, until, accounts: selectedAccounts, currency, granularity },
  ctx: { session },
}) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      account: {
        id: selectedAccounts ? { in: selectedAccounts } : undefined,
        userId: session?.userId as string,
      },
    },
    include: {
      account: true,
      category: true,
    },
  });
  const accounts = await prisma.bankAccount.findMany({
    where: {
      id: selectedAccounts ? { in: selectedAccounts } : undefined,
      userId: session?.userId as string,
      deletedAt: null,
    },
  });
  const accountIds = accounts.map((account) => account.id);
  const accountsById = accounts.reduce<Record<string, BankAccount>>(
    (acc, account) => ({
      ...acc,
      [account.id]: account,
    }),
    {}
  );
  const rates = await getRates(
    Array.from(
      new Set(transactions.map((transaction) => transaction.account.currency))
    )
  );
  const dateFormat = getFormatForGranularity(granularity);
  const buckets = groupBy(transactions, (transaction) =>
    format(transaction.date, dateFormat)
  );
  const bucketKeys = Object.keys(buckets).sort((a, b) => a.localeCompare(b));
  const data: AccountPositionsBucket[] = [];
  for (const bucketKey of bucketKeys) {
    const prevPositions = accountIds.reduce<Record<string, number>>(
      (acc, accountId) => ({
        ...acc,
        [accountId]:
          data.length > 0
            ? data[data.length - 1].positions[accountsById[accountId].name]
            : accountsById[accountId].initialBalance,
      }),
      {}
    );
    const positions = accountIds.reduce<Record<string, number>>(
      (acc, accountId) => {
        const accountTransactions = buckets[bucketKey].filter(
          (transaction) => transaction.accountId === accountId
        );
        const account = accountsById[accountId];
        const balance = accountTransactions.reduce(
          (sum, transaction) =>
            sum +
            convertTransactionAmount(
              transaction.amount,
              account.currency,
              currency,
              rates
            ),
          prevPositions[accountId]
        );
        return {
          ...acc,
          [account.name]: balance,
        };
      },
      {}
    );
    data.push({
      bucket: format(
        parse(bucketKey, dateFormat, new Date()),
        getDisplayFormatForGranularity(granularity)
      ),
      positions,
      total: Object.values(positions).reduce(
        (acc, position) => acc + position,
        0
      ),
    });
  }

  const formatedFrom = from && format(new Date(from), dateFormat);
  const formatedUntil = until && format(new Date(until), dateFormat);
  return data.filter((datum, index) => {
    if (formatedFrom && bucketKeys[index] < formatedFrom) {
      return false;
    }
    if (formatedUntil && bucketKeys[index] > formatedUntil) {
      return false;
    }
    return true;
  });
};

export default procedure
  .input(GetAccountPositionsReportInput)
  .output(GetAccountPositionsReportOutput)
  .query(getAccountPositionsReport);
