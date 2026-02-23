import { type NextRequest, NextResponse } from 'next/server';

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withAPIKey(handler: Handler): Handler {
  return async (req) => {
    const key = req.headers.get('x-api-key');
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
}
