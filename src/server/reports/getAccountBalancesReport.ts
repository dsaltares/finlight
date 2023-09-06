import format from 'date-fns/format';
import groupBy from 'lodash.groupby';
import parse from 'date-fns/parse';
import type { BankAccount } from '@prisma/client';
import createUTCDate from '@lib/createUTCDate';
import { type Procedure, procedure } from '@server/trpc';
import prisma from '@server/prisma';
import { getDateWhereFromFilter } from '@server/transaction/utils';
import {
  type AccountPositionsBucket,
  GetAccountPositionsReportInput,
  GetAccountPositionsReportOutput,
} from './types';
import {
  getRates,
  convertAmount,
  getFormatForGranularity,
  getDisplayFormatForGranularity,
} from './utils';

export const getAccountBalancesReport: Procedure<
  GetAccountPositionsReportInput,
  GetAccountPositionsReportOutput
> = async ({
  input: { date, accounts: selectedAccounts, currency, granularity },
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
    {},
  );
  const accountsByName = accounts.reduce<Record<string, BankAccount>>(
    (acc, account) => ({
      ...acc,
      [account.name]: account,
    }),
    {},
  );
  const rates = await getRates(
    Array.from(
      new Set([
        ...transactions.map((transaction) => transaction.account.currency),
        currency,
      ]),
    ),
  );
  const dateFormat = getFormatForGranularity(granularity);
  const buckets = groupBy(transactions, (transaction) =>
    format(transaction.date, dateFormat),
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
      {},
    );
    const positions = accountIds.reduce<Record<string, number>>(
      (acc, accountId) => {
        const accountTransactions = buckets[bucketKey].filter(
          (transaction) => transaction.accountId === accountId,
        );
        const account = accountsById[accountId];
        const balance = accountTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          prevPositions[accountId],
        );
        return {
          ...acc,
          [account.name]: balance,
        };
      },
      {},
    );
    data.push({
      bucket: format(
        parse(bucketKey, dateFormat, createUTCDate()),
        getDisplayFormatForGranularity(granularity),
      ),
      positions,
      total: 0,
    });
  }

  const { gte: from, lte: until } = getDateWhereFromFilter(date);
  const formatedFrom = from && format(createUTCDate(from), dateFormat);
  const formatedUntil = until && format(createUTCDate(until), dateFormat);
  return data
    .filter((_datum, index) => {
      if (formatedFrom && bucketKeys[index] < formatedFrom) {
        return false;
      }
      if (formatedUntil && bucketKeys[index] > formatedUntil) {
        return false;
      }
      return true;
    })
    .map((datum) => {
      const positions = Object.entries(datum.positions).reduce<
        Record<string, number>
      >(
        (acc, [name, balance]) => ({
          ...acc,
          [name]: convertAmount(
            balance,
            accountsByName[name].currency,
            currency,
            rates,
          ),
        }),
        {},
      );
      return {
        ...datum,
        positions,
        total: Object.values(positions).reduce(
          (acc, position) => acc + position,
          0,
        ),
      };
    });
};

export default procedure
  .input(GetAccountPositionsReportInput)
  .output(GetAccountPositionsReportOutput)
  .query(getAccountBalancesReport);
