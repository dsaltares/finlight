// biome-ignore lint/style/noRestrictedImports: this is the sole gateway to the AI SDK
import { openai } from '@ai-sdk/openai';
// biome-ignore lint/style/noRestrictedImports: this is the sole gateway to the AI SDK
import { generateText as _generateText, Output } from 'ai';
import { db } from '@/server/db';
import { getLogger } from '@/server/logger';

const logger = getLogger('llm');

type GenerateTextParams = Parameters<typeof _generateText>[0];
type TrackedParams = GenerateTextParams & { userId: string };

export async function generateText({ userId, ...args }: TrackedParams) {
  const result = await _generateText(args);
  await recordLlmUsage({
    userId,
    modelId: result.response.modelId,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });
  return result;
}

type RecordLlmUsageArgs = {
  userId: string;
  modelId: string | undefined;
  inputTokens?: number;
  outputTokens?: number;
};

async function recordLlmUsage({
  userId,
  modelId,
  inputTokens: rawInput,
  outputTokens: rawOutput,
}: RecordLlmUsageArgs): Promise<void> {
  const model = modelId?.trim() || 'unknown';
  const inputTokens =
    typeof rawInput === 'number' && Number.isFinite(rawInput) ? rawInput : 0;
  const outputTokens =
    typeof rawOutput === 'number' && Number.isFinite(rawOutput) ? rawOutput : 0;

  const pricing = getModelPricing(model);
  const inputCostUsdMicros = usdToMicros(
    (inputTokens / 1_000_000) * pricing.inputUsdPer1M,
  );
  const outputCostUsdMicros = usdToMicros(
    (outputTokens / 1_000_000) * pricing.outputUsdPer1M,
  );

  try {
    await db
      .insertInto('llm_usage')
      .values({
        userId,
        model,
        inputTokens,
        outputTokens,
        inputCostUsdMicros,
        outputCostUsdMicros,
        costUsdMicros: inputCostUsdMicros + outputCostUsdMicros,
      })
      .execute();

    logger.info(
      {
        userId,
        model,
        inputTokens,
        outputTokens,
        costUsd: ((inputCostUsdMicros + outputCostUsdMicros) / 1_000_000).toFixed(6),
      },
      'AI usage tracked',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to persist LLM usage');
  }
}

type ModelPricing = {
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

function getModelPricing(modelId: string): ModelPricing {
  if (modelId.startsWith('gpt-4o-mini')) {
    return { inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 };
  }
  if (modelId.startsWith('gpt-5-mini')) {
    return { inputUsdPer1M: 0.25, outputUsdPer1M: 2.0 };
  }
  if (modelId.startsWith('gpt-4.1-mini')) {
    return { inputUsdPer1M: 0.4, outputUsdPer1M: 1.6 };
  }
  if (modelId.startsWith('gpt-4.1')) {
    return { inputUsdPer1M: 2.0, outputUsdPer1M: 8.0 };
  }
  if (modelId.startsWith('gpt-5')) {
    return { inputUsdPer1M: 1.25, outputUsdPer1M: 10.0 };
  }
  return { inputUsdPer1M: 1.25, outputUsdPer1M: 10.0 };
}

function usdToMicros(usd: number): number {
  if (!Number.isFinite(usd)) return 0;
  return Math.round(usd * 1_000_000);
}

export { openai, Output };
