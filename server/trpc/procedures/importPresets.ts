import { TRPCError } from '@trpc/server';
import lodash from 'lodash';
import z from 'zod';
import { CsvImportFieldSchema } from '@/lib/importPresets';
import { db } from '@/server/db';
import { parseSpreadsheet } from '@/server/spreadsheet';
import { authedProcedure } from '../trpc';

const CSVImportPresetSchema = z.object({
  id: z.number(),
  name: z.string(),
  fields: z.array(CsvImportFieldSchema),
  dateFormat: z.string(),
  delimiter: z.string(),
  decimal: z.string(),
  rowsToSkipStart: z.number(),
  rowsToSkipEnd: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CSVImportPreset = z.infer<typeof CSVImportPresetSchema>;

const listPresets = authedProcedure
  .input(z.void())
  .output(z.array(CSVImportPresetSchema))
  .query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db
      .selectFrom('csv_import_preset')
      .selectAll()
      .where('userId', '=', ctx.user.id)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'asc')
      .execute();
  });

const createPreset = authedProcedure
  .input(
    CSVImportPresetSchema.pick({
      name: true,
      fields: true,
      dateFormat: true,
      delimiter: true,
      decimal: true,
      rowsToSkipStart: true,
      rowsToSkipEnd: true,
    }),
  )
  .output(CSVImportPresetSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const userId = ctx.user.id;
    return await db.transaction().execute(async (trx) => {
      const existingActivePreset = await trx
        .selectFrom('csv_import_preset')
        .select(['id'])
        .where('userId', '=', userId)
        .where('name', '=', input.name)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (existingActivePreset) {
        return await trx
          .updateTable('csv_import_preset')
          .set({
            ...input,
            fields: JSON.stringify(input.fields),
          })
          .where('id', '=', existingActivePreset.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      const existingDeletedPreset = await trx
        .selectFrom('csv_import_preset')
        .select(['id'])
        .where('userId', '=', userId)
        .where('name', '=', input.name)
        .where('deletedAt', 'is not', null)
        .orderBy('updatedAt', 'desc')
        .executeTakeFirst();

      if (existingDeletedPreset) {
        return await trx
          .updateTable('csv_import_preset')
          .set({
            ...input,
            fields: JSON.stringify(input.fields),
            deletedAt: null,
          })
          .where('id', '=', existingDeletedPreset.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      return await trx
        .insertInto('csv_import_preset')
        .values({
          userId,
          ...input,
          fields: JSON.stringify(input.fields),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });
  });

const deletePreset = authedProcedure
  .input(z.number())
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    await db
      .updateTable('csv_import_preset')
      .set({ deletedAt: new Date().toISOString() })
      .where('userId', '=', ctx.user.id)
      .where('id', '=', input)
      .execute();
  });

const updatePreset = authedProcedure
  .input(
    CSVImportPresetSchema.pick({
      name: true,
      fields: true,
      dateFormat: true,
      delimiter: true,
      decimal: true,
      rowsToSkipStart: true,
      rowsToSkipEnd: true,
    })
      .partial()
      .extend({
        id: CSVImportPresetSchema.shape.id,
      }),
  )
  .output(CSVImportPresetSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db
      .updateTable('csv_import_preset')
      .set({
        ...lodash.omit(input, ['userId', 'id']),
        fields: JSON.stringify(input.fields),
        deletedAt: null,
      })
      .where('userId', '=', ctx.user.id)
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  });

const parseSpreadsheetProcedure = authedProcedure
  .input(
    z.object({
      fileBase64: z.string().max(14_000_000),
      fileName: z.string(),
    }),
  )
  .output(z.array(z.array(z.string())))
  .mutation(({ input }) => {
    const buffer = Buffer.from(input.fileBase64, 'base64');
    return parseSpreadsheet({ buffer, fileName: input.fileName });
  });

export default {
  list: listPresets,
  create: createPreset,
  delete: deletePreset,
  update: updatePreset,
  parseSpreadsheet: parseSpreadsheetProcedure,
};
