/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import createUTCDate from '@lib/createUTCDate';
import prisma from '@server/prisma';
import { PolygonGroupedDailyFX } from '@lib/polygon';

const ratesPath = path.join('data', 'exchangeRates');

const getFiles = () => {
  const files = fs.readdirSync(ratesPath);
  return files.map((file) => path.join(ratesPath, file));
};

const importExchangeRatesForFile = async (file: string) => {
  const rates = (
    PolygonGroupedDailyFX.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
      .results || []
  ).filter((rate) => rate.T.split(':')[1].startsWith('EUR'));
  const date = createUTCDate(path.basename(file, '.json'));
  console.log(`Importing ${rates.length} rates for ${date}`);
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
  return rates.length;
};

const cleanUpOldRates = async () => {
  console.log('Cleaning up old rates');
  await prisma.$executeRaw`
    delete from "ExchangeRate" e1
    where
      date < (
        select
          max(date)
        from
          "ExchangeRate" e2
        where
          e1.ticker = e2.ticker
      );`;
};

const importExchangeRates = async () => {
  const files = getFiles();
  let totalRateCount = 0;
  for (const file of files) {
    totalRateCount += await importExchangeRatesForFile(file);
  }
  console.log(`Imported ${totalRateCount} rates`);
  await cleanUpOldRates();
};

void importExchangeRates();
