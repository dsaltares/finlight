import { PromisePool } from '@supercharge/promise-pool';
import chunk from 'lodash/chunk';
import z from 'zod';
import {
  type ImportPresetConfig,
  ImportPresetConfigSchema,
} from '@/lib/importPresets';
import { generateText, Output, openai, recordCustomUsage } from '@/server/llm';
import { getLogger } from '@/server/logger';
import { TransactionTypeSchema } from '@/server/trpc/procedures/schema';

const logger = getLogger('ai');

const CHUNK_SIZE = 50;
const CONCURRENCY = 5;

type CategorizeTransactionsArgs = {
  userId: string;
  descriptions: string[];
  categories: { id: number; name: string }[];
  user: { email: string; name: string };
};

type CategorizeResult = {
  categoryId: number | null;
  type: 'Income' | 'Expense' | 'Transfer';
};

const ResultItemSchema = z.object({
  categoryId: z.number().nullable(),
  type: TransactionTypeSchema,
});

export async function categorizeTransactions({
  userId,
  descriptions,
  categories,
  user,
}: CategorizeTransactionsArgs): Promise<CategorizeResult[]> {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set, skipping AI categorization');
    return [];
  }

  try {
    const chunks = chunk(descriptions, CHUNK_SIZE);
    const results: CategorizeResult[] = new Array(descriptions.length);

    const { errors } = await PromisePool.for(chunks)
      .withConcurrency(CONCURRENCY)
      .process(async (batch, chunkIndex) => {
        const chunkResults = await categorizeChunk({
          userId,
          batch,
          categories,
          user,
        });
        const offset = chunkIndex * CHUNK_SIZE;
        for (let i = 0; i < chunkResults.length; i++) {
          results[offset + i] = chunkResults[i];
        }
      });

    if (errors.length > 0) {
      logger.error({ errors }, 'Some AI categorization chunks failed');
    }

    return results;
  } catch (error) {
    logger.error({ error }, 'AI categorization failed');
    return [];
  }
}

type CategorizeChunkArgs = {
  userId: string;
  batch: string[];
  categories: { id: number; name: string }[];
  user: { email: string; name: string };
};

async function categorizeChunk({
  userId,
  batch,
  categories,
  user,
}: CategorizeChunkArgs): Promise<CategorizeResult[]> {
  const categoryList = categories.map((c) => `  ${c.id}: ${c.name}`).join('\n');

  const descriptionList = batch.map((d, i) => `  ${i}: ${d}`).join('\n');

  const result = await generateText({
    userId,
    model: openai('gpt-5-mini'),
    output: Output.object({
      schema: z.object({
        results: z.array(ResultItemSchema),
      }),
    }),
    prompt: `
      You are a financial transaction categorizer. The account owner is ${user.name} (${user.email}).
      For each transaction description below, determine:
      1. The most appropriate category from the provided list (use categoryId, or null if none fit)
      2. The transaction type: "Income", "Expense", or "Transfer"

      Categories:
      ${categoryList}

      Transactions (index: description):
      ${descriptionList}

      Return one result per transaction, in the same order.
      Use the transaction description and common sense to determine the type:
      - "Income" for salary, interest, investment revenue, etc.
      - "Expense" for purchases, bills, subscriptions, withdrawals, fees and incoming transfers from third parties to cover for shared expenses.
      - "Transfer" for transfers between the owner's own accounts, currency exchanges. Look for the owner's name in the description as a hint.
      
      Other rules:
      - If you are not sure about the category, return null.

      `,
  });

  if (!result.output) return [];

  const validCategoryIds = new Set(categories.map((c) => c.id));
  return result.output.results.map((r: z.infer<typeof ResultItemSchema>) => ({
    categoryId:
      r.categoryId && validCategoryIds.has(r.categoryId) ? r.categoryId : null,
    type: r.type,
  }));
}

type GenerateImportPresetArgs = {
  userId: string;
  csvContent: string;
};

const MaxSampleLines = 50;

export async function generateImportPreset({
  userId,
  csvContent,
}: GenerateImportPresetArgs): Promise<ImportPresetConfig> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const sampleLines = csvContent
    .split('\n')
    .slice(0, MaxSampleLines)
    .join('\n');

  const result = await generateText({
    userId,
    model: openai('gpt-5-mini'),
    output: Output.object({
      schema: z.object({ preset: ImportPresetConfigSchema }),
    }),
    prompt: `
      You are a CSV import configuration expert. Analyze the following CSV/spreadsheet sample and determine the import configuration for a personal finance app.

      Available field types for each column:
      - "Date": Column containing transaction dates
      - "Amount": Column containing transaction amounts (positive and/or negative values)
      - "Withdrawal": Column containing withdrawal/debit amounts only
      - "Deposit": Column containing deposit/credit amounts only
      - "Fee": Column containing fee amounts
      - "Description": Column containing transaction descriptions/narratives
      - "Ignore": Column that should be ignored (e.g., balance, reference numbers, etc.)

      Rules:
      - The "fields" array must have exactly one entry per column in the data
      - There must be exactly one "Date" field
      - There must be at least one "Description" field
      - Use "Amount" when a single column contains both positive and negative values
      - Use "Withdrawal" and "Deposit" when debits and credits are in separate columns
      - Use "Ignore" for columns like running balance, transaction ID, reference, etc.

      For dateFormat, use date-fns format tokens:
      - "yyyy-MM-dd" for 2024-01-15
      - "dd/MM/yyyy" for 15/01/2024
      - "MM/dd/yyyy" for 01/15/2024
      - "dd.MM.yyyy" for 15.01.2024
      - "dd-MM-yyyy" for 15-01-2024
      - "d/M/yyyy" for 5/1/2024
      - "yyyy/MM/dd" for 2024/01/15

      For delimiter: the character separating columns ("," or ";" or "\\t")
      For decimal: the decimal separator used in numbers ("." for 1234.56, "," for 1234,56)
      For rowsToSkipStart: number of header rows to skip before data begins (usually 1 for a header row, 0 if no headers)
      For rowsToSkipEnd: number of footer/summary rows to skip at the end (usually 0)

      CSV sample:
      ${sampleLines}`,
  });

  if (!result.output) {
    throw new Error('Failed to generate import preset from CSV');
  }

  const preset = ImportPresetConfigSchema.parse(result.output.preset);

  logger.info(
    { fieldsCount: preset.fields.length },
    'Import preset generated by AI',
  );

  return preset;
}

const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';
const MISTRAL_OCR_MODEL = 'mistral-ocr-latest';
const OCR_COST_USD_MICROS_PER_PAGE = 1000;

const ExtractedTransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
});

export type ParsedPdfTransaction = z.infer<typeof ExtractedTransactionSchema>;

type ParsePdfTransactionsArgs = {
  userId: string;
  fileBase64: string;
  currency: string;
};

export async function parsePdfTransactions({
  userId,
  fileBase64,
  currency,
}: ParsePdfTransactionsArgs): Promise<ParsedPdfTransaction[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }

  const response = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_OCR_MODEL,
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${fileBase64}`,
      },
      include_image_base64: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, 'Mistral OCR failed');
    throw new Error(`Mistral OCR failed with status ${response.status}`);
  }

  const data = await response.json();
  const markdown = data.pages
    .map((page: { markdown: string }) => page.markdown)
    .join('\n\n');
  const pagesProcessed = data.usage_info?.pages_processed ?? data.pages.length;

  const costUsdMicros = pagesProcessed * OCR_COST_USD_MICROS_PER_PAGE;
  await recordCustomUsage({ userId, model: MISTRAL_OCR_MODEL, costUsdMicros });

  logger.info(
    { pagesProcessed, markdownLength: markdown.length },
    'PDF OCR completed',
  );

  const result = await generateText({
    userId,
    model: openai('gpt-5-mini'),
    output: Output.object({
      schema: z.object({
        transactions: z.array(ExtractedTransactionSchema),
      }),
    }),
    prompt: `
      You are a financial data extractor. Extract all transactions from this bank statement.

      The statement currency is ${currency}.
      For each transaction, return:
      - date: in YYYY-MM-DD format
      - description: the transaction description or narrative
      - amount: the transaction amount as a decimal number in ${currency}.
        Use negative values for debits, expenses, and withdrawals.
        Use positive values for credits, income, and deposits.

      Return all transactions found in the statement, in chronological order.
      If no transactions are found, return an empty array.

      Bank statement (in Markdown format):
      ${markdown}
    `,
  });

  if (!result.output) return [];
  return result.output.transactions;
}
