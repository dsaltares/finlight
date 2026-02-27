import { db } from '@/server/db';

export type RatesByCurrency = Record<string, number>;

export async function getRates(
  currencies: string[],
): Promise<RatesByCurrency> {
  const unique = [...new Set(currencies)];
  const rates = await Promise.all(
    unique.map(async (currency) => {
      if (currency === 'EUR') return { currency, rate: 1 };
      const row = await db
        .selectFrom('exchange_rate')
        .select('close')
        .where('ticker', '=', `EUR${currency}`)
        .orderBy('date', 'desc')
        .executeTakeFirst();
      return { currency, rate: row?.close ?? 1 };
    }),
  );
  return Object.fromEntries(rates.map((r) => [r.currency, r.rate]));
}

export function convertAmount(
  amountInCents: number,
  currency: string,
  targetCurrency: string,
  rates: RatesByCurrency,
) {
  if (currency === targetCurrency) return amountInCents;
  const eurToTarget = rates[targetCurrency] ?? 1;
  const eurToSource = rates[currency] ?? 1;
  return Math.round((amountInCents * eurToTarget) / eurToSource);
}
