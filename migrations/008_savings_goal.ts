import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    create table if not exists "savings_goal" (
      "id" integer not null primary key autoincrement,
      "userId" text not null references "user" ("id") on delete cascade,
      "name" text not null,
      "targetAmount" integer not null,
      "currency" text not null default 'EUR',
      "startDate" text,
      "deadline" text,
      "completedAt" text,
      "deletedAt" text,
      "createdAt" text default CURRENT_TIMESTAMP not null,
      "updatedAt" text default CURRENT_TIMESTAMP not null
    );
  `.execute(db);
  await sql`
    create trigger if not exists "savings_goal_updated_at_trigger" after update on "savings_goal"
    begin
      update "savings_goal" set "updatedAt" = CURRENT_TIMESTAMP where "id" = NEW."id";
    end;
  `.execute(db);
  await sql`
    create table if not exists "savings_goal_account" (
      "id" integer not null primary key autoincrement,
      "goalId" integer not null references "savings_goal" ("id") on delete cascade,
      "accountId" integer not null references "bank_account" ("id") on delete cascade,
      "createdAt" text default CURRENT_TIMESTAMP not null,
      constraint "unique_goal_account" unique ("goalId", "accountId")
    );
  `.execute(db);
}

export async function down(db: Kysely<unknown>) {
  await sql`drop table if exists "savings_goal_account";`.execute(db);
  await sql`drop trigger if exists "savings_goal_updated_at_trigger";`.execute(
    db,
  );
  await sql`drop table if exists "savings_goal";`.execute(db);
}
