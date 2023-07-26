/* eslint-disable no-console */
import format from 'date-fns/format';
import startOfYesterday from 'date-fns/startOfYesterday';
import type { NextApiHandler } from 'next';
import isToday from 'date-fns/isToday';
import addDays from 'date-fns/addDays';
import chunk from 'lodash.chunk';
import prisma from '@server/prisma';
import { PolygonGroupedDailyFX } from '@lib/polygon';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  if (req.query.CRON_API_KEY !== process.env.CRON_API_KEY) {
    res.status(401).end();
    return;
  }

  const latestRate = await prisma.exchangeRate.findFirst({
    orderBy: { date: 'desc' },
  });

  const dates: Date[] = [];
  let dateTmp = latestRate?.date || startOfYesterday();
  while (!isToday(dateTmp)) {
    dates.push(dateTmp);
    dateTmp = addDays(dateTmp, 1);
  }

  const dateChunks = chunk(dates, 5);
  for (const dateChunk of dateChunks) {
    await Promise.all(dateChunk.map(importRates));
    console.log('Waiting 60 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
  }

  let date = latestRate?.date || startOfYesterday();
  while (!isToday(date)) {
    date = addDays(date, 1);
  }
  res.status(200).end();
};

export default handler;

const importRates = async (date: Date) => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  console.log(`Fetching exchange rates for ${formattedDate}`);
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/grouped/locale/global/market/fx/${formattedDate}?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`,
  );
  const rates = (
    PolygonGroupedDailyFX.parse(await response.json()).results || []
  ).filter((rate) => rate.T.split(':')[1].startsWith('EUR'));
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
};
