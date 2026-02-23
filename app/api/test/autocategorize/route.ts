import { type NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { categorizeTransactions } from '@/server/ai';
import { db } from '@/server/db';
import { withAPIKey } from '@/server/withAPIKey';

const RequestSchema = z.object({
  email: z.email(),
  transactions: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    }),
  ),
});

export const POST = withAPIKey(async (req: NextRequest) => {
  const body = RequestSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues }, { status: 400 });
  }

  const { email, transactions } = body.data;

  const user = await db
    .selectFrom('user')
    .select(['id', 'email', 'name'])
    .where('email', '=', email)
    .executeTakeFirst();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const categories = await db
    .selectFrom('category')
    .select(['id', 'name'])
    .where('userId', '=', user.id)
    .where('deletedAt', 'is', null)
    .execute();

  const descriptions = transactions.map((t) => t.description);
  const results = await categorizeTransactions({
    userId: user.id,
    descriptions,
    categories,
    user: { email: user.email, name: user.name },
  });

  const categorized = transactions.map((t, i) => ({
    ...t,
    categoryId: results[i]?.categoryId ?? null,
    categoryName:
      categories.find((c) => c.id === results[i]?.categoryId)?.name ?? null,
    type: results[i]?.type ?? null,
  }));

  return NextResponse.json({ transactions: categorized });
});
