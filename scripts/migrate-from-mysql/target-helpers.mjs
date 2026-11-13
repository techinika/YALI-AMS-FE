/**
 * Data API upsert helpers for Supabase target tables.
 */
export async function upsertTableRows(target, table, rows, { onConflict = 'id', ignoreDuplicates = false, batchSize = 500 } = {}) {
  if (!rows.length) return { count: 0 };
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const opts = { onConflict, ignoreDuplicates, returning: 'minimal' };
    const { error, count } = await target.supabase.from(table).upsert(chunk, opts);
    if (error) throw new Error(`${table}: ${error.message ?? String(error)}`);
    total += Number(count ?? chunk.length);
  }
  return { count: total };
}