import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    create table if not exists "llm_usage" (
      "id" integer not null primary key autoincrement,
      "userId" text not null references "user" ("id") on delete cascade,
      "model" text not null,
      "inputTokens" integer not null default 0,
      "outputTokens" integer not null default 0,
      "inputCostUsdMicros" integer not null default 0,
      "outputCostUsdMicros" integer not null default 0,
      "costUsdMicros" integer not null default 0,
      "createdAt" text default CURRENT_TIMESTAMP not null
    );
  `.execute(db);
}

export async function down(db: Kysely<unknown>) {
  await sql`drop table if exists "llm_usage";`.execute(db);
}
