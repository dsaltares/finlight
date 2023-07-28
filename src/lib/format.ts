import format from 'date-fns/format';
import type { TimeGranularity } from '@server/reports/types';

export const formatDate = (date: Date | string) =>
  format(new Date(date), 'dd MMMM yyyy');

export const formatDateWithGranularity = (
  date: Date | string,
  granularity: TimeGranularity,
) => {
  const formatString =
    granularity === 'Daily'
      ? 'dd MMMM yyyy'
      : granularity === 'Monthly'
      ? 'MMMM yyyy'
      : granularity === 'Quarterly'
      ? 'qqq yyyy'
      : 'yyyy';
  return format(new Date(date), formatString);
};

export const formatAmount = (amount: number, currency: string | undefined) =>
  isNaN(amount)
    ? '-'
    : new Intl.NumberFormat('en-UK', {
        style: 'currency',
        currency: currency || 'EUR',
      })
        .format(parseFloat(amount.toString().replace('-0', '0')))
        .replace('-0', '0');

export const formatPercentage = (percentage: number) =>
  `${(percentage * 100).toFixed(2)}%`;
