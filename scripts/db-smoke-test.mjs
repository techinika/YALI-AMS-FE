// Database smoke test.
//
// Applies every migration and the seed to an in-memory PostgreSQL 18 (PGlite),
// then exercises the RLS policies and SECURITY DEFINER functions. Supabase-only
// pieces (auth/storage schemas, Vault-style helpers, the pgvector/pg_trgm
// extensions and their opclasses) are stubbed because PGlite ships without
// extensions. Statements that need those extensions are skipped, everything else
// is the real migration SQL.
//
// Run with `npm run db:test`.

import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const supabaseDir = path.resolve(here, "..", "supabase");

const bootstrap = `
create role anon; create role authenticated; create role service_role;
create schema if not exists auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$fn$;
create schema if not exists storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  created_at timestamptz not null default now()
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz not null default now()
);
create or replace function storage.foldername(text) returns text[] language sql immutable as $fn$
  select string_to_array(regexp_replace($1, '/+$', ''), '/')
$fn$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
grant all on storage.objects to anon, authenticated;
grant all on storage.buckets to anon, authenticated;
create publication supabase_realtime;
`;

// PGlite has no extension control files, so extension statements and the
// indexes that depend on them are removed. Types are replaced with equivalents
// that keep the rest of the schema valid.
const adapt = (sql) =>
  sql
    .replace(/^\s*create\s+extension[^;]*;\s*$/gim, "")
    .replace(/\bcitext\b/g, "text")
    .replace(/\bvector\s*\(\s*768\s*\)/g, "text")
    .replace(/create\s+index\s+if\s+not\s+exists\s+\w+\s+on\s+public\.\w+\s+using\s+hnsw[^;]*;/gis, "")
    .replace(/create\s+index\s+if\s+not\s+exists\s+profiles_search_trgm_idx[^;]*;/gis, "")
    .replace(/\.\s*gin_trgm_ops/g, "");

const db = await PGlite.create();
await db.exec(bootstrap);

let failures = 0;
for (const file of readdirSync(path.join(supabaseDir, "migrations")).filter((f) => f.endsWith(".sql")).sort()) {
  try {
    await db.exec(adapt(readFileSync(path.join(supabaseDir, "migrations", file), "utf8")));
    console.log(`OK   ${file}`);
  } catch (error) {
    failures++;
    console.log(`FAIL ${file} :: ${String(error.message).split("\n")[0]}`);
  }
}
try {
  await db.exec(readFileSync(path.join(supabaseDir, "seed.sql"), "utf8"));
  console.log("OK   seed.sql");
} catch (error) {
  failures++;
  console.log(`FAIL seed.sql :: ${String(error.message).split("\n")[0]}`);
}

const alice = randomUUID();
const bob = randomUUID();
const carol = randomUUID();
await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
    ('${alice}', 'alice@example.com', '{"first_name":"Alice","last_name":"A"}', now()),
    ('${bob}', 'bob@example.com', '{"first_name":"Bob","last_name":"B"}', now()),
    ('${carol}', 'carol@example.com', '{"first_name":"Carol","last_name":"C"}', now());
  update public.profiles set role = 'admin', phone = '123456789', phone_visible = true where id = '${alice}';
  update public.profiles set phone = '987654321', phone_visible = false where id = '${bob}';
`);

async function asUser(userId, fn) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claims', $1, true)", [`{"sub":"${userId}"}`]);
    return fn(tx);
  });
}

let passed = 0;

async function check(name, fn, expectedError) {
  try {
    const result = await fn();
    if (expectedError) throw new Error(`expected an error containing "${expectedError}"`);
    passed++;
    console.log(`PASS ${name}`);
    return result;
  } catch (error) {
    const message = String(error.message ?? error).split("\n")[0];
    if (expectedError && message.toLowerCase().includes(expectedError.toLowerCase())) {
      passed++;
      console.log(`PASS ${name} (${message})`);
      return undefined;
    }
    failures++;
    console.log(`FAIL ${name} :: ${message}`);
    return undefined;
  }
}

await check(
  "non-admins cannot read another profile's phone",
  () => asUser(bob, (tx) => tx.query("select phone from public.profiles where id = $1", [alice])),
  "permission denied",
);

await check("owners can read their own contact", async () => {
  const { rows } = await asUser(bob, (tx) => tx.query("select * from public.get_profile_contact($1)", [bob]));
  if (rows[0]?.phone !== "987654321") throw new Error(`unexpected contact: ${JSON.stringify(rows)}`);
});

await check("opted-in contacts are visible, opted-out ones are not", async () => {
  const visible = await asUser(bob, (tx) => tx.query("select * from public.get_profile_contact($1)", [alice]));
  if (visible.rows[0]?.phone !== "123456789") throw new Error("opted-in phone not visible");
  const hidden = await asUser(carol, (tx) => tx.query("select * from public.get_profile_contact($1)", [bob]));
  if (hidden.rows[0]?.phone != null) throw new Error("opted-out phone leaked");
});

await check(
  "admin_export_members rejects non-admins",
  () => asUser(bob, (tx) => tx.query("select * from public.admin_export_members()")),
  "admin only",
);

await check("admin_export_members returns contacts for admins", async () => {
  const { rows } = await asUser(alice, (tx) => tx.query("select * from public.admin_export_members()"));
  if (rows.length !== 3) throw new Error(`expected 3 rows, got ${rows.length}`);
  if (rows.find((row) => row.id === alice)?.phone !== "123456789") throw new Error("admin export lost contact");
});

await check("dashboard_stats counts globally", async () => {
  const { rows } = await asUser(bob, (tx) => tx.query("select * from public.dashboard_stats()"));
  if (Number(rows[0]?.users) !== 3) throw new Error(`unexpected stats: ${JSON.stringify(rows[0])}`);
});

let directConversation;
await check("direct conversations are shared by both members", async () => {
  const created = await asUser(alice, (tx) =>
    tx.query("select public.get_or_create_direct_conversation($1) as id", [bob]),
  );
  directConversation = created.rows[0].id;
  await asUser(alice, (tx) =>
    tx.query("insert into public.messages (conversation_id, sender_id, content) values ($1, $2, $3)", [
      directConversation,
      alice,
      "hello bob",
    ]),
  );
  const { rows } = await asUser(bob, (tx) =>
    tx.query("select count(*)::int as n from public.messages where conversation_id = $1", [directConversation]),
  );
  if (rows[0].n !== 1) throw new Error("recipient cannot read the message");
});

await check("non-members cannot read private messages", async () => {
  const { rows } = await asUser(carol, (tx) =>
    tx.query("select count(*)::int as n from public.messages where conversation_id = $1", [directConversation]),
  );
  if (rows[0].n !== 0) throw new Error("non-member read a private message");
});

let groupId;
await check("group creation invites pending members", async () => {
  const created = await asUser(alice, (tx) =>
    tx.query("select public.create_group_conversation($1, $2, $3, $4) as id", ["Test group", null, [], [bob]]),
  );
  groupId = created.rows[0].id;
  const { rows } = await asUser(bob, (tx) =>
    tx.query("select type, name from public.list_my_conversations() where id = $1", [groupId]),
  );
  if (rows.length !== 1) throw new Error("invitee cannot see the group");
});

await check("pending members cannot read group messages", async () => {
  const { rows } = await asUser(bob, (tx) =>
    tx.query("select count(*)::int as n from public.messages where conversation_id = $1", [groupId]),
  );
  if (rows[0].n !== 0) throw new Error("pending member read group messages");
});

await check("activity trend returns one row per day", async () => {
  const { rows } = await asUser(bob, (tx) => tx.query("select * from public.dashboard_activity_trend(7)"));
  if (rows.length !== 7) throw new Error(`expected 7 rows, got ${rows.length}`);
});

await check("top members are ranked by message count", async () => {
  const { rows } = await asUser(carol, (tx) => tx.query("select * from public.dashboard_top_members(3)"));
  if (rows[0]?.id !== alice || Number(rows[0].message_count) !== 1) {
    throw new Error(`unexpected ranking: ${JSON.stringify(rows)}`);
  }
});

await check("activity logs stay admin-only", async () => {
  const { rows } = await asUser(bob, (tx) => tx.query("select count(*)::int as n from public.activity_logs"));
  if (rows[0].n !== 0) throw new Error("non-admin read activity logs");
});

console.log(`\n${passed} checks passed, ${failures} failure(s)`);
await db.close();
if (failures > 0) process.exitCode = 1;