import { PromisePool } from '@supercharge/promise-pool';
import chunk from 'lodash/chunk';
import z from 'zod';
import { generateText, Output, openai } from '@/server/llm';
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
