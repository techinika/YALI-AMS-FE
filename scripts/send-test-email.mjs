#!/usr/bin/env node
/**
 * Send a test email through Resend to verify domain verification and API keys.
 *
 * Usage:
 *   node scripts/send-test-email.mjs you@example.com
 *   npm run email:test -- you@example.com
 *
 * Required in .env:
 *   RESEND_API_KEY
 *   EMAIL_FROM   (must use a domain verified in Resend)
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

const to = process.argv[2]?.trim();
const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.EMAIL_FROM?.trim() || "YALI AMS <no-reply@yalirwandachapter.org>";

if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}
if (!apiKey) {
  console.error(
    "Missing RESEND_API_KEY in .env.\n" +
      "Create a key at https://resend.com/api-keys and add it to .env."
  );
  process.exit(1);
}

const sentAt = new Date().toISOString();
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "YALI AMS email test",
    text: `This is a test email from YALI AMS. If you received it, Resend is configured correctly.\n\nSent at ${sentAt}.`,
    html: `<p>This is a test email from <strong>YALI AMS</strong>. If you received it, Resend is configured correctly.</p><p style="color:#6b7280">Sent at ${sentAt}.</p>`,
  }),
});

const body = await response.json().catch(() => null);
if (!response.ok) {
  console.error(`Resend rejected the email (HTTP ${response.status}).`);
  console.error(body?.message ?? body?.error ?? body);
  process.exit(1);
}

console.log(`Test email sent to ${to}. Resend id: ${body?.id ?? "unknown"}`);
