import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import addYears from 'date-fns/addYears';
import endOfMonth from 'date-fns/endOfMonth';
import endOfYear from 'date-fns/endOfYear';
import startOfMonth from 'date-fns/startOfMonth';
import startOfToday from 'date-fns/startOfToday';
import startOfYear from 'date-fns/startOfYear';
import createUTCDate from '@lib/createUTCDate';
import prisma from '@server/prisma';
import type { DateFilter } from '@server/types';
import { isDateRange, isPeriod, type Period } from '@server/types';

export const updateAccountBalance = async (accountId: string) => {
  const account = await prisma.bankAccount.findFirstOrThrow({
    where: { id: accountId },
  });
  const transactions = await prisma.transaction.findMany({
    where: { accountId, deletedAt: null },
  });
  return prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      balance:
        Math.round(
          transactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            account.initialBalance,
          ) * 100,
        ) / 100,
    },
  });
};

export const getDateWhereFromFilter = (date: DateFilter | undefined) => {
  if (isDateRange(date)) {
    return {
      gte: date?.from || undefined,
      lte: date?.until || undefined,
    };
  } else if (isPeriod(date)) {
    const [gte, lte] = getDateRangeForPeriod(date);
    return {
      gte,
      lte,
    };
  }
  return { gte: undefined, lte: undefined };
};

const getDateRangeForPeriod = (period: Period | '') => {
  const now = createUTCDate();
  const today = startOfToday();
  switch (period) {
    case 'last30Days':
      return [addDays(today, -30), now];
    case 'last90Days':
      return [addDays(today, -90), now];
    case 'currentMonth':
      return [startOfMonth(now), endOfMonth(now)];
    case 'lastMonth': {
      const oneMonthAgo = addMonths(now, -1);
      return [startOfMonth(oneMonthAgo), endOfMonth(oneMonthAgo)];
    }
    case 'last3Months': {
      const threeMonthsAgo = addMonths(now, -2);
      return [startOfMonth(threeMonthsAgo), endOfMonth(now)];
    }
    case 'currentYear':
      return [startOfYear(now), endOfYear(now)];
    case 'lastYear': {
      const oneYearAgo = addYears(now, -1);
      return [startOfYear(oneYearAgo), endOfYear(oneYearAgo)];
    }
    default:
      return [undefined, undefined];
  }
};

export default getDateRangeForPeriod;
