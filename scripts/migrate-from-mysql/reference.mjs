/**
 * Load target reference data, build legacy→target id maps, and ensure any
 * legacy reference values not present in the seed are inserted idempotently.
 */
import { upsertTableRows } from './target-helpers.mjs';
import { uuidv5 } from './uuid.mjs';

const COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';

export async function loadReferenceMaps(target) {
  const [countries, states, districts, sectors, genders, cohorts, tracks, workingSectors] = await Promise.all([
    target.supabase.from('countries').select('id,name,c_id'),
    target.supabase.from('states').select('id,name,country_code'),
    target.supabase.from('districts').select('id,name'),
    target.supabase.from('sectors').select('id,name,district_id'),
    target.supabase.from('genders').select('id,name'),
    target.supabase.from('cohorts').select('id,name'),
    target.supabase.from('tracks').select('id,name'),
    target.supabase.from('working_sectors').select('id,name'),
  ]);
  const fail = (name, r) => { if (r.error) throw new Error(`reference ${name}: ${r.error.message ?? String(r.error)}`); };
  fail('countries', countries); fail('states', states); fail('districts', districts); fail('sectors', sectors);
  fail('genders', genders); fail('cohorts', cohorts); fail('tracks', tracks); fail('working_sectors', workingSectors);

  const maps = {
    countryById: new Map(), countryByName: new Map(), countryByCid: new Map(),
    stateById: new Map(), stateByCountryName: new Map(),
    districtById: new Map(), districtByName: new Map(),
    sectorById: new Map(), sectorByKey: new Map(),
    genderByName: new Map(),
    cohortById: new Map(),
    trackById: new Map(), trackByName: new Map(),
    workingSectorById: new Map(), workingSectorByName: new Map(),
  };

  for (const c of countries.data) {
    maps.countryById.set(c.id, c.id);
    maps.countryByName.set(c.name.toLowerCase(), c.id);
    if (c.c_id != null) maps.countryByCid.set(c.c_id, c.id);
  }
  for (const s of states.data) {
    maps.stateById.set(s.id, s.id);
    maps.stateByCountryName.set(`${s.country_code}|${s.name.toLowerCase()}`, s.id);
  }
  for (const d of districts.data) {
    maps.districtById.set(d.id, d.id);
    maps.districtByName.set(d.name.toLowerCase(), d.id);
  }
  for (const s of sectors.data) {
    maps.sectorById.set(s.id, s.id);
    maps.sectorByKey.set(`${s.district_id}|${s.name.toLowerCase()}`, s.id);
  }
  for (const g of genders.data) maps.genderByName.set(g.name.toLowerCase(), g.id);
  for (const c of cohorts.data) maps.cohortById.set(c.id, c.id);
  for (const t of tracks.data) { maps.trackById.set(t.id, t.id); maps.trackByName.set(t.name.toLowerCase(), t.id); }
  for (const w of workingSectors.data) { maps.workingSectorById.set(w.id, w.id); maps.workingSectorByName.set(w.name.toLowerCase(), w.id); }

  return { maps, reference: { countries: countries.data, states: states.data, districts: districts.data, sectors: sectors.data, genders: genders.data, cohorts: cohorts.data, tracks: tracks.data, workingSectors: workingSectors.data }, COMMUNITY_ID };
}

export function mapCountry(maps, legacyId, name, cId) {
  if (maps.countryById.has(legacyId)) return maps.countryById.get(legacyId);
  const byName = maps.countryByName.get(String(name ?? '').toLowerCase());
  if (byName) return byName;
  if (cId != null && maps.countryByCid.has(cId)) return maps.countryByCid.get(cId);
  return null;
}

export function mapState(maps, legacyId, name, countryCode) {
  if (maps.stateById.has(legacyId)) return maps.stateById.get(legacyId);
  const cc = resolveCountryId(maps, countryCode);
  const key = `${cc}|${String(name ?? '').toLowerCase()}`;
  if (maps.stateByCountryName.has(key)) return maps.stateByCountryName.get(key);
  return null;
}

export function mapDistrict(maps, legacyId, name) {
  if (maps.districtById.has(legacyId)) return maps.districtById.get(legacyId);
  if (maps.districtByName.has(String(name ?? '').toLowerCase())) return maps.districtByName.get(String(name).toLowerCase());
  return null;
}

export function mapSector(maps, legacyId, name, districtName) {
  if (maps.sectorById.has(legacyId)) return maps.sectorById.get(legacyId);
  const districtId = mapDistrict(maps, null, districtName);
  const key = `${districtId ?? 'unspecified'}|${String(name ?? '').toLowerCase()}`;
  if (maps.sectorByKey.has(key)) return maps.sectorByKey.get(key);
  return null;
}

export function resolveCountryId(maps, countryCode) {
  if (!countryCode) return 'unspecified';
  const cc = String(countryCode).trim();
  const byName = maps.countryByName.get(cc.toLowerCase());
  if (byName) return byName;
  const byCid = maps.countryByCid.has(Number(cc)) ? maps.countryByCid.get(Number(cc)) : null;
  if (byCid) return byCid;
  return 'unspecified';
}
export function mapGender(name) {
  return maps.genderByName.get(String(name ?? '').toLowerCase()) ?? null;
}

export function mapCohort(maps, id) {
  return maps.cohortById.has(id) ? id : null;
}

export function mapTrack(maps, legacyId, name) {
  if (maps.trackById.has(legacyId)) return maps.trackById.get(legacyId);
  return maps.trackByName.get(String(name ?? '').toLowerCase()) ?? null;
}

export function mapWorkingSector(maps, legacyId, name) {
  if (maps.workingSectorById.has(legacyId)) return maps.workingSectorById.get(legacyId);
  return maps.workingSectorByName.get(String(name ?? '').toLowerCase()) ?? null;
}

export async function ensureReferenceData(target, maps, legacy, report) {
  const results = {};

  // Countries not yet in target: insert with legacy id.
  const newCountries = legacy.countries.filter(c => !maps.countryById.has(c.id));
  if (newCountries.length) {
    const rows = newCountries.map(c => ({ id: c.id, name: c.name, c_id: c.c_id }));
    await upsertTableRows(target, 'countries', rows, { onConflict: 'id', ignoreDuplicates: true });
    for (const c of newCountries) {
      maps.countryById.set(c.id, c.id);
      maps.countryByName.set(c.name.toLowerCase(), c.id);
      if (c.c_id != null) maps.countryByCid.set(c.c_id, c.id);
    }
    results.countries = newCountries.length;
  }

  // States not yet in target: insert with legacy id. country_code may map to 'unspecified'.
  const newStates = [];
  for (const s of legacy.states) {
    if (maps.stateById.has(s.id)) continue;
    const countryId = resolveCountryId(maps, s.countryCode);
    const key = `${countryId}|${String(s.name ?? '').toLowerCase()}`;
    if (maps.stateByCountryName.has(key)) continue;
    newStates.push({ id: s.id, name: s.name, country_code: countryId });
  }
  if (newStates.length) {
    await upsertTableRows(target, 'states', newStates, { onConflict: 'id', ignoreDuplicates: true });
    for (const s of newStates) maps.stateById.set(s.id, s.id);
    results.states = newStates.length;
  }

  // Districts not yet in target.
  const newDistricts = legacy.districts.filter(d => !maps.districtById.has(d.id));
  if (newDistricts.length) {
    const rows = newDistricts.map(d => ({ id: d.id, name: d.name }));
    await upsertTableRows(target, 'districts', rows, { onConflict: 'id', ignoreDuplicates: true });
    for (const d of newDistricts) maps.districtById.set(d.id, d.id);
    results.districts = newDistricts.length;
  }

  // Sectors not yet in target: insert with legacy:<id> under mapped district.
  const newSectors = [];
  for (const s of legacy.sectors) {
    if (maps.sectorById.has(s.id)) continue;
    const districtId = mapDistrict(maps, null, s.districtName) ?? 'unspecified';
    const key = `${districtId}|${String(s.name ?? '').toLowerCase()}`;
    if (maps.sectorByKey.has(key)) continue;
    newSectors.push({ id: `legacy:${s.id}`, name: s.name, district_id: districtId });
  }
  if (newSectors.length) {
    await upsertTableRows(target, 'sectors', newSectors, { onConflict: 'id', ignoreDuplicates: true });
    for (const s of newSectors) maps.sectorById.set(s.id, `legacy:${s.id}`);
    results.sectors = newSectors.length;
  }

  // Cohorts missing from seed (legacy ids should match 1..56).
  const newCohorts = legacy.cohorts.filter(c => !maps.cohortById.has(c.id));
  if (newCohorts.length) {
    const rows = newCohorts.map(c => ({ id: c.id, name: c.name }));
    await upsertTableRows(target, 'cohorts', rows, { onConflict: 'id', ignoreDuplicates: true });
    for (const c of newCohorts) maps.cohortById.set(c.id, c.id);
    results.cohorts = newCohorts.length;
  }

  report.referenceMigrated = results;
  return results;
}