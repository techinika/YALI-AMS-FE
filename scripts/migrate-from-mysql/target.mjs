/**
 * Supabase target client.
 *
 * Auth users are created via the Admin API (password-hash support). Data rows
 * go through the Supabase Data API with the service_role key (bypasses RLS).
 * Storage uploads use the service_role client.
 */
import { createClient } from '@supabase/supabase-js';

export class Target {
  constructor({ url, serviceRoleKey, anonKey, avatarsBucket = 'avatars' }) {
    this.url = url;
    this.serviceRoleKey = serviceRoleKey;
    this.supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    this.storage = this.supabase.storage.from(avatarsBucket);
    this.anonClient = anonKey ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
    this.avatarBucket = avatarsBucket;
  }

  async authUserExists(id) {
    const { data, error } = await this.supabase.auth.admin.getUserById(id);
    if (error || !data?.user) return null;
    return data.user;
  }

  async createAuthUser({ id, email, passwordHash, emailConfirm, userMetadata }) {
    if (!email) return { ok: false, reason: 'no-email', id };
    const existing = await this.authUserExists(id);
    if (existing) return { ok: true, skipped: true, reason: 'exists', id };
    const params = { id, email, email_confirm: !!emailConfirm, user_metadata: userMetadata || {} };
    if (passwordHash) params.password_hash = passwordHash;
    const { data, error } = await this.supabase.auth.admin.createUser(params);
    if (error) return { ok: false, reason: error.message || String(error), id };
    return { ok: true, user: data.user };
  }

  async verifyPassword({ email, password }) {
    if (!this.anonClient || !email || !password) return { ok: false, reason: 'no-anon-key-or-missing' };
    const { error } = await this.anonClient.auth.signInWithPassword({ email, password });
    return { ok: !error, reason: error ? String(error) : 'ok' };
  }

  async upsert(table, rows, { onConflict = 'id', batchSize = 500 } = {}) {
    if (!rows.length) return { count: 0, inserted: 0 };
    let total = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { error, count } = await this.supabase.from(table).upsert(chunk, {
        onConflict,
        ignoreDuplicates: false,
        returning: 'minimal',
      });
      if (error) throw new Error(`${table}: ${error.message ?? String(error)}`);
      total += Number(count ?? chunk.length);
    }
    return { count: total, inserted: total };
  }

  async upsertIgnore(table, rows, { onConflict = 'id', batchSize = 500 } = {}) {
    if (!rows.length) return { count: 0 };
    let total = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { error, count } = await this.supabase.from(table).upsert(chunk, {
        onConflict,
        ignoreDuplicates: true,
        returning: 'minimal',
      });
      if (error) throw new Error(`${table}: ${error.message ?? String(error)}`);
      total += Number(count ?? chunk.length);
    }
    return { count: total };
  }

  async updateProfile(id, patch) {
    const { error } = await this.supabase.from('profiles').update(patch).eq('id', id);
    if (error) throw new Error(`profiles.update ${id}: ${error.message ?? String(error)}`);
  }

  async uploadAvatar(path, buffer, contentType) {
    const { error } = await this.storage.upload(path, buffer, { contentType, upsert: true });
    return { ok: !error, reason: error ? String(error) : undefined };
  }

  async close() {}
}