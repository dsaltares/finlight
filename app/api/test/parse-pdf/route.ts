import { type NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { parsePdfTransactions } from '@/server/ai';
import { db } from '@/server/db';
import { withAPIKey } from '@/server/withAPIKey';

const RequestSchema = z.object({
  email: z.email(),
  fileBase64: z.string(),
  currency: z.string().default('EUR'),
});

export const POST = withAPIKey(async (req: NextRequest) => {
  const body = RequestSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues }, { status: 400 });
  }

  const { email, fileBase64, currency } = body.data;

  const user = await db
    .selectFrom('user')
    .select(['id'])
    .where('email', '=', email)
    .executeTakeFirst();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const transactions = await parsePdfTransactions({
    userId: user.id,
    fileBase64,
    currency,
  });

  return NextResponse.json({ transactions });
});
