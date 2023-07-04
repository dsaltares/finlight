/* eslint-disable no-console */
import format from 'date-fns/format';
import startOfYesterday from 'date-fns/startOfYesterday';
import type { NextApiHandler } from 'next';
import z from 'zod';
import prisma from '@server/prisma';

export const PolygonGroupedDailyFX = z.object({
  adjusted: z.boolean(),
  count: z.number().optional(),
  queryCount: z.number(),
  resultsCount: z.number(),
  status: z.literal('OK'),
  request_id: z.string(),
  results: z
    .array(
      z.object({
        T: z.string(),
        c: z.number(),
        h: z.number(),
        l: z.number(),
        n: z.number(),
        o: z.number(),
        t: z.number(),
        v: z.number(),
        vw: z.number().optional(),
      })
    )
    .optional(),
});

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  if (req.query.CRON_API_KEY !== process.env.CRON_API_KEY) {
    res.status(401).end();
    return;
  }

  const date = startOfYesterday();
  const formattedDate = format(date, 'yyyy-MM-dd');
  console.log(`Fetching exchange rates for ${formattedDate}`);
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/grouped/locale/global/market/fx/${formattedDate}?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`
  );
  const rates =
    PolygonGroupedDailyFX.parse(await response.json()).results || [];
  console.log(`Saving ${rates.length} rates for ${formattedDate}`);
  await prisma.exchangeRate.createMany({
    data: rates.map((rate) => ({
      date,
      ticker: rate.T.split(':')[1],
      open: rate.o,
      high: rate.h,
      low: rate.l,
      close: rate.c,
    })),
    skipDuplicates: true,
  });
  res.status(200).end();
};

export default handler;
