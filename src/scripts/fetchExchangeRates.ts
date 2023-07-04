/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import startOfYear from 'date-fns/startOfYear';
import addYears from 'date-fns/addYears';
import addDays from 'date-fns/addDays';
import isTomorrow from 'date-fns/isTomorrow';
import format from 'date-fns/format';
import chunk from 'lodash.chunk';
import fetch from 'node-fetch';
import z from 'zod';

const ratesPath = path.join('data', 'exchangeRates');

const PolygonGroupedDailyFX = z.object({
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

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getDatesToFetch = () => {
  const dates: Date[] = [];
  for (
    let date = startOfYear(addYears(new Date(), -1));
    !isTomorrow(date);
    date = addDays(date, 1)
  ) {
    const fileExists = fs.existsSync(
      path.join(ratesPath, `${formatDate(date)}.json`)
    );
    if (!fileExists) {
      dates.push(date);
    }
  }

  return dates;
};

const fetchExchangeRatesForDate = async (date: Date) => {
  const formattedDate = formatDate(date);
  console.log('Fetching exchange rates for', formattedDate);
  try {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/grouped/locale/global/market/fx/${formattedDate}?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`
    );
    const data = await response.json();
    const polygonResponse = PolygonGroupedDailyFX.parse(data);
    fs.writeFileSync(
      path.join(ratesPath, `${formattedDate}.json`),
      JSON.stringify(polygonResponse, null, 2)
    );
  } catch (e) {
    console.log('Error fetching exchange rates for', formattedDate, e);
  }
};

const fetchExchangeRates = async () => {
  const dates = getDatesToFetch();
  const dateChunks = chunk(dates, 5);
  for (const dateChunk of dateChunks) {
    await Promise.all(dateChunk.map(fetchExchangeRatesForDate));
    console.log('Waiting 1 minute...');
    await wait(60 * 1000);
  }
};

void fetchExchangeRates();
