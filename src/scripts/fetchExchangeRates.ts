/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import startOfYear from 'date-fns/startOfYear';
import addYears from 'date-fns/addYears';
import addDays from 'date-fns/addDays';
import isToday from 'date-fns/isToday';
import format from 'date-fns/format';
import chunk from 'lodash.chunk';
import fetch from 'node-fetch';
import { PolygonGroupedDailyFX } from '@lib/polygon';

const ratesPath = path.join('data', 'exchangeRates');

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getDatesToFetch = () => {
  const dates: Date[] = [];
  for (
    let date = startOfYear(addYears(new Date(), -1));
    !isToday(date);
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

const rateLimit = async <T>(
  data: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number,
  timeUnitMs: number
) => {
  const chunks = chunk(data, concurrency);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(fn));
    console.log(`Waiting ${timeUnitMs / 1000} seconds...`);
    await wait(timeUnitMs);
  }
};

const fetchExchangeRates = async () => {
  const dates = getDatesToFetch();
  await rateLimit(dates, fetchExchangeRatesForDate, 5, 60 * 1000);
};

void fetchExchangeRates();
