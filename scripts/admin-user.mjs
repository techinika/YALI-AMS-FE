#!/usr/bin/env node
/**
 * Admin/user recovery helper for the hosted Supabase project.
 *
 * This script uses the service-role key, so keep it local. It is the fastest
 * way to diagnose "invalid login credentials" after a manual user import.
 *
 * Usage:
 *   node scripts/admin-user.mjs inspect <email>
 *   node scripts/admin-user.mjs confirm <email>
 *   node scripts/admin-user.mjs set-password <email> <new-password>
 *   node scripts/admin-user.mjs promote <email>
 *   node scripts/admin-user.mjs demote <email>
 *   node scripts/admin-user.mjs create <email> <password> [admin]
 *
 * Required in .env (never commit these):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnv(path.resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.\n" +
      "Copy the service_role key from Supabase Dashboard → Project Settings → API."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser(email) {
  const target = email.toLowerCase();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users ?? [];
    const user = users.find((u) => u.email?.toLowerCase() === target);
    if (user) return user;
    if (users.length < 1000) return null;
    page += 1;
  }
}

async function profileFor(id) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name, role, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function requireUser(email) {
  const user = await findUser(email);
  if (!user) {
    console.error(`No auth.users row found for ${email} in this Supabase project.`);
    process.exit(1);
  }
  return user;
}

async function inspect(email) {
  const user = await requireUser(email);
  const profile = await profileFor(user.id);
  console.log(
    JSON.stringify(
      {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        identity_count: user.identities?.length ?? 0,
        identity_providers: (user.identities ?? []).map((i) => i.provider),
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        profile,
      },
      null,
      2
    )
  );

  if (!user.email_confirmed_at) {
    console.log("\n→ Email is NOT confirmed. Run: node scripts/admin-user.mjs confirm " + email);
  }
  if ((user.identities?.length ?? 0) === 0) {
    console.log(
      "\n→ No auth.identities row. Recreate this user with the Dashboard or `admin.auth.admin.createUser`."
    );
  }
  if (!profile) {
    console.log("\n→ No public.profiles row. It should be created by handle_new_user on signup.");
  } else if (profile.role !== "admin") {
    console.log("\n→ Profile role is " + profile.role + ". Promote with: node scripts/admin-user.mjs promote " + email);
  }
}

async function confirm(email) {
  const user = await requireUser(email);
  const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (error) throw error;
  const { error: profileError } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", user.id);
  if (profileError) throw profileError;
  console.log(`Confirmed ${email}.`);
}

async function setPassword(email, password) {
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const user = await requireUser(email);
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
  console.log(`Password updated for ${email}.`);
}

async function setRole(email, role) {
  const user = await requireUser(email);
  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", user.id)
    .select("id, role")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    console.error(`No profile row for ${email}. Create the profile first.`);
    process.exit(1);
  }
  console.log(`${email} is now ${role}.`);
}

async function create(email, password, role = "user") {
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const existing = await findUser(email);
  if (existing) {
    console.error(`${email} already exists. Use confirm/set-password/promote instead.`);
    process.exit(1);
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: email.split("@")[0],
      last_name: "",
      role: "user",
    },
  });
  if (error) throw error;
  if (role === "admin") await setRole(email, "admin");
  console.log(`Created ${email} (confirmed${role === "admin" ? ", admin" : ""}).`);
  console.log(`id: ${data.user?.id}`);
}

async function main() {
  const [command, email, arg] = process.argv.slice(2);
  if (!command || !email) {
    console.error(
      "Usage: node scripts/admin-user.mjs <inspect|confirm|set-password|promote|demote|create> <email> [password|admin]"
    );
    process.exit(1);
  }

  switch (command) {
    case "inspect":
      await inspect(email);
      break;
    case "confirm":
      await confirm(email);
      break;
    case "set-password":
      await setPassword(email, arg);
      break;
    case "promote":
      await setRole(email, "admin");
      break;
    case "demote":
      await setRole(email, "user");
      break;
    case "create":
      await create(email, arg, process.argv[5] === "admin" ? "admin" : "user");
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exit(1);
});
