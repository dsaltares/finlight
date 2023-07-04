import z from 'zod';

export const PolygonGroupedDailyFX = z.object({
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
