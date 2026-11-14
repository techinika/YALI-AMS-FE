/**
 * Deterministic UUID v5 (SHA-1) generation per RFC 4122.
 * Used for legacy IDs that are integers or derived, so re-runs are idempotent.
 */
import { createHash } from 'node:crypto';

const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function formatBytes(bytes) {
  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidv5(name, namespace = NAMESPACE_DNS) {
  const bytes = new Uint8Array(createHash('sha1')
    .update(hexToBytes(namespace.replace(/-/g, '')))
    .update(Buffer.from(String(name), 'utf8'))
    .digest()
    .subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  return formatBytes(bytes);
}

export function uuidv4() {
  return formatBytes(crypto.randomUUID ? crypto.randomUUID().split('-').join('') : Buffer.from(crypto.randomBytes(16)));
}