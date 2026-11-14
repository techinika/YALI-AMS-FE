/**
 * Pure transform / mapping helpers used across migration steps.
 */
import { createHash } from 'node:crypto';
import { uuidv5 } from './uuid.mjs';

export const PROFILE_STATUSES = new Set(['invited', 'active', 'inactive', 'deleted']);
export const MEMBERSHIP_STATUSES = new Set([
  'admin_approval_pending', 'member_joining_pending', 'approved', 'admin_rejected', 'member_rejected', 'member_left',
]);
export const MATCH_STATUSES = new Set(['pending', 'completed', 'failed']);
export const MATCH_TYPES = new Set(['user', 'group']);

export function mapRole(roleId, roleName) {
  const name = String(roleName ?? '').toUpperCase();
  if (name === 'ADMIN' || roleId === '11') return 'admin';
  if (name === 'USER' || roleId === '12') return 'user';
  return 'user';
}

export function mapStatus(status) {
  const s = String(status ?? 'inactive').toLowerCase().trim();
  return PROFILE_STATUSES.has(s) ? s : 'inactive';
}

export function mapMembershipStatus(status) {
  const s = String(status ?? 'admin_approval_pending').toLowerCase().trim();
  return MEMBERSHIP_STATUSES.has(s) ? s : 'admin_approval_pending';
}

export function matchStatus(status) {
  const s = String(status ?? 'pending').toLowerCase().trim();
  return MATCH_STATUSES.has(s) ? s : 'pending';
}

export function matchType(type) {
  const s = String(type ?? 'user').toLowerCase().trim();
  return MATCH_TYPES.has(s) ? s : 'user';
}

export function splitInterests(value) {
  if (value == null) return [];
  const items = String(value).split(/[,\n;|]+/).map(s => s.trim()).filter(Boolean);
  return [...new Set(items)].slice(0, 50);
}

export function clampScore(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  const n = Number.parseInt(String(score), 10);
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(0, n));
}

export function truncateReason(reason) {
  if (reason == null) return null;
  return String(reason).trim().slice(0, 200);
}

export function normalizeDetails(details) {
  if (details == null) return {};
  if (typeof details === 'string') {
    try { return JSON.parse(details); } catch { return { raw: String(details).slice(0, 4000) }; }
  }
  return details;
}

export function extFromUrl(url, contentType) {
  try {
    const p = new URL(url).pathname.toLowerCase();
    const m = p.match(/\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/);
    if (m) return `.${m[1]}`;
  } catch {}
  if (/image\/png/.test(contentType)) return '.png';
  if (/image\/webp/.test(contentType)) return '.webp';
  if (/image\/gif/.test(contentType)) return '.gif';
  if (/image\/avif/.test(contentType)) return '.avif';
  if (/image\/svg/.test(contentType)) return '.svg';
  return '.jpg';
}

export function privateConversationId(userIdA, userIdB) {
  const sorted = [userIdA, userIdB].sort();
  return uuidv5(`private:${sorted[0]}:${sorted[1]}`);
}

export function canonicalRow(row, fields) {
  const obj = {};
  for (const f of fields) {
    let v = row[f];
    if (v === null || v === undefined) v = null;
    else if (v instanceof Date) v = v.toISOString();
    obj[f] = v;
  }
  return obj;
}

export function checksumRows(rows, fields) {
  const idField = fields[0];
  const sorted = rows.slice().sort((a, b) => String(a[idField] ?? '').localeCompare(String(b[idField] ?? '')));
  const payload = sorted.map(r => JSON.stringify(canonicalRow(r, fields))).join('\n');
  return createHash('sha256').update(payload).digest('hex');
}

export function esc(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

export function dateValue(v) {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}