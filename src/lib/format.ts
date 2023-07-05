import format from 'date-fns/format';

export const formatDate = (date: Date | string) =>
  format(new Date(date), 'dd MMMM yyyy');

export const formatAmount = (amount: number, currency: string | undefined) =>
  isNaN(amount)
    ? '-'
    : new Intl.NumberFormat('en-UK', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(amount);
