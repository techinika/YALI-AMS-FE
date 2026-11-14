#!/usr/bin/env node
/**
 * MySQL → Supabase migration orchestrator (Phase 2).
 *
 * This is a one-off, idempotent migration tool. It is intentionally destructive
 * to the *target* only via upserts; it never writes to MySQL.
 *
 * Safety:
 *   * Requires --confirm-production when targeting a non-localhost Supabase URL.
 *   * Dry-run mode performs no target writes.
 *   * Never run against production without an explicit go-ahead and a backup.
 */
import { loadConfig, required, isLocalhost } from './config.mjs';
import { Source } from './source.mjs';
import { Target } from './target.mjs';
import { loadReferenceMaps, ensureReferenceData } from './reference.mjs';
import {
  migrateUsers, migrateOrganizations, migrateChat, migrateNotifications,
  migrateMatchmaking, migrateActivity, migrateAvatars, verifyPasswordImport,
} from './steps.mjs';
import { verify } from './verify.mjs';
import { writeReport, redactConfig } from './report.mjs';

async function main() {
  const config = loadConfig();
  required(config.source.database, 'DATABASE_NAME');
  required(config.source.user, 'DATABASE_USER');
  required(config.target.url, 'NEXT_PUBLIC_SUPABASE_URL');
  required(config.target.serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');

  if (!isLocalhost(config.target.url) && !config.confirmProduction) {
    throw new Error(
      'Refusing to migrate to a non-localhost target. Set MIGRATION_CONFIRM_PRODUCTION=true ' +
      'and pass --confirm-production after taking a backup.'
    );
  }

  const source = new Source(config);
  const target = new Target(config);
  const start = Date.now();
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: config.dryRun,
    config: redactConfig(config),
    counts: {},
    errors: [],
    skipped: {},
    images: {},
    passwords: {},
    checksums: {},
    durationMs: 0,
    ok: true,
  };

  const ctx = {
    source, target, config, report,
    dryRun: config.dryRun,
    limit: config.limit,
    batchSize: config.batchSize,
    usersByLegacyId: new Map(),
    orgIdByLegacyId: new Map(),
    groupIds: new Set(),
  };

  try {
    await source.connect();
    await target.connect();

    // Optional password-hash verification against a known test user.
    if (config.verifyPasswordEmail) {
      const res = await verifyPasswordImport(target, config.verifyPasswordEmail, config.verifyPassword);
      report.passwords = res;
      if (!res.ok) {
        console.warn(`[WARN] Password import verification failed: ${res.reason}. Continuing without importing password hashes.`);
        ctx.importPasswords = false;
      } else {
        ctx.importPasswords = true;
      }
    } else {
      ctx.importPasswords = true; // unverified — document in report
      report.passwords.verified = false;
      report.passwords.reason = 'no test user provided';
    }

    // Reference data + legacy→target id maps.
    const ref = await loadReferenceMaps(target);
    ctx.maps = ref.maps;
    await ensureReferenceData(target, ref.maps, {
      countries: await source.countries(),
      states: await source.states(),
      districts: await source.districts(),
      sectors: await source.sectors(),
      cohorts: await source.cohorts(),
    }, report);

    const steps = config.steps.length ? config.steps : [
      'users', 'organizations', 'chat', 'notifications', 'matchmaking', 'activity', 'avatars',
    ];

    for (const step of steps) {
      console.log(`[migrate] step: ${step}`);
      if (step === 'users') await migrateUsers(ctx);
      else if (step === 'organizations') await migrateOrganizations(ctx);
      else if (step === 'chat') await migrateChat(ctx);
      else if (step === 'notifications') await migrateNotifications(ctx);
      else if (step === 'matchmaking') await migrateMatchmaking(ctx);
      else if (step === 'activity') await migrateActivity(ctx);
      else if (step === 'avatars') await migrateAvatars(ctx);
      else throw new Error(`Unknown step: ${step}`);
    }

    const verification = await verify(ctx);
    report.mismatches = verification.mismatches || [];

    report.errors.push(...report.errors); // already collected by steps
    report.ok = report.errors.length === 0;
  } catch (err) {
    report.ok = false;
    report.fatal = String(err);
    console.error('[FATAL]', err);
    throw err;
  } finally {
    report.durationMs = Date.now() - start;
    await source.close();
    await target.close();
  }

  const dir = `${config.reportDir}/${new Date().toISOString().replace(/[:.]/g, '-')}`;
  writeReport(dir, report);
  report.reportDir = dir;

  console.log(`\nMigration complete. Report: ${dir}`);
  console.log(`OK: ${report.ok} | Errors: ${report.errors.length} | Duration: ${report.durationMs} ms`);
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});