/**
 * Configuration, env loading and argument parsing for the MySQL→Supabase migration.
 *
 * Safety:
 *   * Only read-only queries are issued against MySQL.
 *   * Dry-run mode performs no target writes.
 *   * Runs against a non-localhost Supabase target require MIGRATION_CONFIRM_PRODUCTION=true.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const INT = (v, d) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : d;
};
const BOOL = (v, d = false) => v == null ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export function parseArgs(argv) {
  const flags = new Set();
  const opts = new Map();
  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '--skip-checksum') {
      flags.add(arg.slice(2));
      continue;
    }
    const m = /^--([a-z0-9-]+)=(.*)$/i.exec(arg);
    if (m) opts.set(m[1].toLowerCase(), m[2]);
    else if (arg.startsWith('--')) flags.add(arg.slice(2));
  }
  return { flags, opts };
}

export function loadEnvFile(file) {
  if (!file) return {};
  try {
    const text = readFileSync(file, 'utf8');
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!m) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) value = value.slice(1, -1);
      env[m[1]] = value;
    }
    return env;
  } catch {
    return {};
  }
}

export function loadConfig() {
  const here = path.dirname(new URL(import.meta.url).pathname);
  const repoRoot = path.resolve(here, '../..');

  const { flags, opts } = parseArgs(process.argv.slice(2));
  const loadEnv = (f) => Object.assign(process.env, loadEnvFile(f));

  const sourceEnv = opts['source-env'] || process.env.MIGRATION_SOURCE_ENV || path.resolve(repoRoot, '../YALI-AMS-BE/.env');
  loadEnv(sourceEnv);

  const cfg = {
    dryRun: BOOL(process.env.MIGRATION_DRY_RUN || flags.has('dry-run')),
    limit: INT(process.env.MIGRATION_LIMIT || opts['limit'], 0),
    batchSize: INT(process.env.MIGRATION_BATCH_SIZE || opts['batch-size'], 500),
    steps: (process.env.MIGRATION_STEPS || opts['steps'] || '')
      .split(',').map(s => s.trim()).filter(Boolean),
    confirmProduction: BOOL(process.env.MIGRATION_CONFIRM_PRODUCTION || flags.has('confirm-production')),
    reportDir: opts['report-dir'] || process.env.MIGRATION_REPORT_DIR || path.resolve(here, 'reports'),
    skipChecksum: BOOL(process.env.MIGRATION_SKIP_CHECKSUM || flags.has('skip-checksum')),
    checksumTables: (process.env.MIGRATION_CHECKSUM_TABLES || opts['checksum-tables'] || '')
      .split(',').map(s => s.trim()).filter(Boolean),

    source: {
      url: process.env.DATABASE_URL || process.env.SOURCE_DB_URL,
      host: process.env.DATABASE_HOST || process.env.SOURCE_DB_HOST,
      port: INT(process.env.DATABASE_PORT || process.env.SOURCE_DB_PORT, 3306),
      user: process.env.DATABASE_USER || process.env.SOURCE_DB_USER,
      password: process.env.DATABASE_PASSWORD || process.env.SOURCE_DB_PASSWORD,
      database: process.env.DATABASE_NAME || process.env.SOURCE_DB_NAME,
    },

    target: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      dbUrl: process.env.SUPABASE_DB_URL,
      avatarsBucket: process.env.SUPABASE_AVATARS_BUCKET || 'avatars',
    },

    verifyPasswordEmail: opts['verify-password-email'],
    verifyPassword: opts['verify-password'],
  };

  return cfg;
}

export function required(value, name) {
  if (value == null || String(value).trim() === '') {
    throw new Error(`Missing required configuration: ${name}`);
  }
  return value;
}

export function isLocalhost(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
  } catch {
    return false;
  }
}

export function redact(value) {
  if (!value) return '<unset>';
  if (value.length <= 4) return '****';
  return value.slice(0, 3) + '...' + value.slice(-2);
}