/**
 * Migration steps: users, organizations, chat, notifications, matchmaking,
 * activity log and avatar migration.
 */
import { mapRole, mapStatus, mapMembershipStatus, matchStatus, matchType, splitInterests,
  clampScore, truncateReason, normalizeDetails, extFromUrl, privateConversationId, dateValue,
  checksumRows } from './transform.mjs';
import { uuidv5 } from './uuid.mjs';

const COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';

export async function mapWithConcurrency(items, concurrency, fn) {
  const results = [];
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const item = items[i++];
      results.push(await fn(item));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export function profileFromUser(u, ctx) {
  const { maps } = ctx;
  const roleName = ctx.roleNameById ? ctx.roleNameById.get(u.roleId) : undefined;
  const countryId = maps.countryById.get(u.residentCountryId) ??
    maps.countryByName.get(String(u.residentCountryId ?? '').toLowerCase()) ?? null;
  const stateId = maps.stateById.get(u.stateId) ?? null;
  const districtId = maps.districtByName.get(String(u.residentDistrictId ?? '').toLowerCase()) ?? null;
  const sectorId = maps.sectorById.get(u.residentSectorId) ?? null;

  return {
    id: u.id,
    first_name: u.firstName ?? '',
    middle_name: u.middleName || null,
    last_name: u.lastName ?? '',
    email: u.email,
    phone: u.phoneNumber || null,
    whatsapp: u.whatsappNumber || null,
    bio: u.bio || null,
    linkedin: u.linkedin || null,
    instagram: u.instagram || null,
    facebook: u.facebook || null,
    twitter: u.twitter || null,
    gender_id: maps.genderByName.get(String(u.genderName ?? '').toLowerCase()) ?? null,
    is_rwandan: u.isRwandan === true || u.isRwandan === 1,
    country_id: countryId,
    state_id: stateId,
    district_id: districtId,
    sector_id: sectorId,
    nearest_landmark: u.nearestLandmark || null,
    cohort_id: maps.cohortById.get(u.cohortId) ?? null,
    track_id: maps.trackById.get(u.trackId) ?? maps.trackByName.get(String(u.trackId ?? '').toLowerCase()) ?? null,
    role: mapRole(u.roleId, roleName),
    status: mapStatus(u.status),
    phone_visible: false,
    whatsapp_visible: false,
    search_text: buildSearchText(u, ctx),
    created_at: dateValue(u.createdAt),
    updated_at: dateValue(u.updatedAt),
  };
}

function buildSearchText(u, ctx) {
  const parts = [];
  if (u.firstName) parts.push(u.firstName);
  if (u.middleName) parts.push(u.middleName);
  if (u.lastName) parts.push(u.lastName);
  if (u.bio) parts.push(u.bio);
  if (u.cohortName) parts.push(u.cohortName);
  if (u.trackName) parts.push(u.trackName);
  if (u.countryName) parts.push(u.countryName);
  if (u.districtName) parts.push(u.districtName);
  if (u.sectorName) parts.push(u.sectorName);
  if (u.genderName) parts.push(u.genderName);
  for (const org of u.orgs || []) {
    if (org.name) parts.push(org.name);
    if (org.position) parts.push(org.position);
  }
  return splitInterests(parts.join(' ')).join(' ');
}

export async function verifyPasswordImport(target, email, password) {
  const res = await target.verifyPassword({ email, password });
  return res;
}

export async function migrateUsers(ctx) {
  const { source, target, report, dryRun, limit, batchSize } = ctx;
  const users = await source.users();
  const roles = await source.roles();
  ctx.roleNameById = new Map(roles.map(r => [r.id, r.name]));

  report.counts.sourceUsers = users.length;
  if (limit) users.splice(0, limit);

  let created = 0, skipped = 0;
  if (!dryRun) {
    await mapWithConcurrency(users, 5, async (u) => {
      let pw = null;
      if (ctx.importPasswords !== false && u.password && /^\$2[aby]\$/.test(String(u.password))) {
        pw = String(u.password);
      }
      const emailConfirm = u.status !== 'invited' && u.status !== 'deleted';
      const res = await target.createAuthUser({
        id: u.id, email: u.email, passwordHash: pw, emailConfirm,
        userMetadata: { first_name: u.firstName, last_name: u.lastName, middle_name: u.middleName },
      });
      if (res.ok) { if (!res.skipped) created++; else skipped++; }
      else { report.errors.push({ table: 'auth.users', id: u.id, email: u.email, error: res.reason }); }
    });

    const profiles = users.map(u => profileFromUser(u, ctx));
    const { count } = await target.upsert('profiles', profiles, { batchSize });
    report.counts.users = count;
    for (const u of users) ctx.usersByLegacyId.set(u.id, u.id);
  }

  report.counts.authUsersCreated = created;
    report.counts.authUsersSkipped = skipped;
    report.passwords.importPasswords = ctx.importPasswords !== false;
  report.skipped.users = users.length - (report.counts.users || 0);
}

export async function migrateOrganizations(ctx) {
  const { source, target, report, dryRun, batchSize } = ctx;
  const orgs = await source.organizations();
  const userOrgs = await source.userOrganizations();
  const orgWS = await source.orgWorkingSectors();

  report.counts.sourceOrganizations = orgs.length;
  if (ctx.config.limit) orgs.splice(0, ctx.config.limit);

  const orgIdByLegacyId = new Map();
  const rows = orgs.map(o => {
    const id = uuidv5(`org:${o.id}`);
    orgIdByLegacyId.set(o.id, id);
    return {
      id, name: o.name || 'Unnamed organization',
      country_id: ctx.maps.countryById.get(o.countryId) ?? null,
      state_id: ctx.maps.stateById.get(o.stateId) ?? null,
      district_id: ctx.maps.districtByName.get(String(o.districtId ?? '').toLowerCase()) ?? null,
      sector_id: ctx.maps.sectorById.get(o.sectorId) ?? null,
      website: o.website || null,
      added_by: ctx.usersByLegacyId.get(o.addedById) ?? null,
      created_at: dateValue(o.createdAt),
      updated_at: dateValue(o.updatedAt),
    };
  });

  if (!dryRun) {
    await target.upsert('organizations', rows, { batchSize });
    report.counts.organizations = rows.length;
    for (const o of orgs) ctx.orgIdByLegacyId.set(o.id, orgIdByLegacyId.get(o.id));
  }

  // User-organization links
  const uoRows = userOrgs.filter(uo => ctx.orgIdByLegacyId.has(uo.organizationId) && ctx.usersByLegacyId.has(uo.userId))
    .map(uo => ({
      id: uo.id,
      user_id: uo.userId,
      organization_id: ctx.orgIdByLegacyId.get(uo.organizationId),
      relation: uo.relation || 'founded',
      position: uo.position || null,
      created_at: dateValue(uo.createdAt),
      updated_at: dateValue(uo.updatedAt),
    }));
  if (!dryRun) {
    await target.upsert('user_organizations', uoRows, { batchSize });
    report.counts.userOrganizations = uoRows.length;
  }

  // Organization-level working sectors (legacy Organization.workingSectorId)
  const owsRows = orgWS.filter(r => ctx.orgIdByLegacyId.has(r.organizationId) && r.workingSectorId && ctx.maps.workingSectorById.has(r.workingSectorId))
    .map(r => ({
      organization_id: ctx.orgIdByLegacyId.get(r.organizationId),
      working_sector_id: ctx.maps.workingSectorById.get(r.workingSectorId),
    }));
  if (!dryRun && owsRows.length) {
    await target.upsertIgnore('organization_working_sectors', owsRows, { onConflict: 'organization_id,working_sector_id' });
    report.counts.orgWorkingSectors = owsRows.length;
  }

  report.skipped.organizations = orgs.length - (report.counts.organizations || 0);
  report.skipped.userOrganizations = userOrgs.length - (report.counts.userOrganizations || 0);
  report.skipped.orgWorkingSectors = orgWS.length - (report.counts.orgWorkingSectors || 0);
}

export async function migrateChat(ctx) {
  const { source, target, report, dryRun, batchSize } = ctx;
  const groups = await source.groups();
  const groupMembers = await source.groupMembers();
  const messages = await source.messages();
  const groupMessages = await source.groupMessages();

  report.counts.sourceGroups = groups.length;
  report.counts.sourceMessages = messages.length;
  report.counts.sourceGroupMessages = groupMessages.length;
  if (ctx.config.limit) {
    groups.splice(0, ctx.config.limit);
    messages.splice(0, ctx.config.limit);
    groupMessages.splice(0, ctx.config.limit);
  }

  const validUsers = new Set([...ctx.usersByLegacyId.keys()]);

  if (!dryRun) {
    // Singleton community conversation
    await target.supabase.from('conversations').upsert({
      id: COMMUNITY_ID, type: 'community', name: 'Community',
      description: 'Public community chat for all YALI alumni', interests: [], created_by: null,
    }, { onConflict: 'id', ignoreDuplicates: true });

    // Groups -> conversations (type group)
    const convRows = groups.map(g => ({
      id: g.id, type: 'group', name: g.name || 'Group', description: g.description || null,
      interests: splitInterests(g.interests), created_by: ctx.usersByLegacyId.get(g.createdById) ?? null,
    }));
    await target.upsert('conversations', convRows, { batchSize });
    report.counts.conversations = convRows.length;
    for (const g of groups) ctx.groupIds.add(g.id);

    // Group members
    const gmRows = groupMembers.filter(m => ctx.groupIds.has(m.groupId) && ctx.usersByLegacyId.has(m.userId))
      .map(m => {
        const creatorId = groups.find(g => g.id === m.groupId)?.createdById;
        return {
          conversation_id: m.groupId,
          user_id: m.userId,
          role: (creatorId === m.userId) ? 'admin' : 'member',
          status: mapMembershipStatus(m.status),
          last_read_at: dateValue(m.createdAt),
          created_at: dateValue(m.createdAt),
          updated_at: dateValue(m.createdAt),
        };
      });
    await target.upsert('conversation_members', gmRows, { onConflict: 'conversation_id,user_id', batchSize });
    report.counts.conversationMembers = gmRows.length;

    // Private conversations from 1:1 messages
    const pairMap = new Map();
    const privateMessages = messages.filter(m => !m.isPublic && m.senderId && m.receiverId);
    for (const m of privateMessages) {
      const key = [m.senderId, m.receiverId].sort().join(':');
      if (!pairMap.has(key)) {
        pairMap.set(key, { id: privateConversationId(m.senderId, m.receiverId), users: [m.senderId, m.receiverId] });
      }
    }
    const pcRows = [];
    const pcMemberRows = [];
    for (const pair of pairMap.values()) {
      pcRows.push({ id: pair.id, type: 'private', name: null, description: null, interests: [], created_by: null });
      for (const uid of pair.users) {
        pcMemberRows.push({ conversation_id: pair.id, user_id: uid, role: 'member', status: 'approved',
          last_read_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
    }
    await target.upsert('conversations', pcRows, { batchSize });
    await target.upsertIgnore('conversation_members', pcMemberRows, { onConflict: 'conversation_id,user_id' });
    report.counts.privateConversations = pcRows.length;
    report.counts.privateConversationMembers = pcMemberRows.length;

    // Messages (public + private + group), keyed by legacy id
    const msgRows = [];
    const seenIds = new Set();
    for (const m of messages) {
      if (!m.senderId || !ctx.usersByLegacyId.has(m.senderId)) continue;
      let conversationId;
      if (m.isPublic) {
        conversationId = COMMUNITY_ID;
      } else {
        const pair = pairMap.get([m.senderId, m.receiverId].sort().join(':'));
        conversationId = pair ? pair.id : null;
      }
      if (!conversationId || seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      msgRows.push({
        id: m.id, conversation_id: conversationId, sender_id: m.senderId,
        content: String(m.message ?? '').slice(0, 4000), created_at: dateValue(m.createdAt),
      });
    }
    for (const m of groupMessages) {
      if (!m.senderId || !ctx.usersByLegacyId.has(m.senderId) || !ctx.groupIds.has(m.groupId) || seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      msgRows.push({ id: m.id, conversation_id: m.groupId, sender_id: m.senderId,
        content: String(m.content ?? '').slice(0, 4000), created_at: dateValue(m.createdAt) });
    }
    if (msgRows.length) await target.upsert('messages', msgRows, { batchSize });
    report.counts.messages = msgRows.length;
    report.skipped.messages = messages.length + groupMessages.length - msgRows.length;
  }

  report.skipped.groups = groups.length - (report.counts.conversations || 0);
  report.skipped.groupMembers = groupMembers.length - (report.counts.conversationMembers || 0);
}

export async function migrateNotifications(ctx) {
  const { source, target, report, dryRun, batchSize } = ctx;
  const notifications = await source.notifications();
  const setups = await source.notificationSetups();

  report.counts.sourceNotifications = notifications.length;
  if (ctx.config.limit) notifications.splice(0, ctx.config.limit);

  const notifRows = notifications.filter(n => ctx.usersByLegacyId.has(n.receiverId))
    .map(n => ({
      id: n.id, receiver_id: n.receiverId, title: n.title || '', message: n.message || '',
      link: n.link || null, opened: !!n.opened,
      created_at: dateValue(n.createdAt), updated_at: dateValue(n.updatedAt),
    }));
  if (!dryRun) {
    await target.upsert('notifications', notifRows, { batchSize });
    report.counts.notifications = notifRows.length;
  }
  report.skipped.notifications = notifications.length - notifRows.length;

  const tmplRows = setups.map(s => ({
    usage: s.usage || 'default', message: s.message || '', link: s.link || null,
    updated_by: ctx.usersByLegacyId.get(s.updatedBy) ?? null,
    created_at: dateValue(s.createdAt), updated_at: dateValue(s.updatedAt),
  }));
  if (!dryRun && tmplRows.length) {
    await target.upsert('notification_templates', tmplRows, { onConflict: 'usage', batchSize });
    report.counts.notificationTemplates = tmplRows.length;
  }
}

export async function migrateMatchmaking(ctx) {
  const { source, target, report, dryRun, batchSize } = ctx;
  const requests = await source.matchmakingRequests();
  const items = await source.matchmakingItems();
  const validRequests = new Set(requests.map(r => r.id));

  report.counts.sourceMatchmakingRequests = requests.length;
  report.counts.sourceMatchmakingItems = items.length;
  if (ctx.config.limit) requests.splice(0, ctx.config.limit);

  const reqRows = requests.map(r => ({
    id: r.id, user_id: r.userId, interests: r.interests || '',
    description: r.description || null,
    status: matchStatus(r.status),
    ai_summary: r.aiSummary || null, ai_notes: r.aiNotes || null,
    ai_response: r.aiResponse || null,
    created_at: dateValue(r.createdAt), updated_at: dateValue(r.updatedAt),
  }));
  if (!dryRun) {
    await target.upsert('matchmaking_requests', reqRows, { batchSize });
    report.counts.matchmakingRequests = reqRows.length;
  }

  const itemRows = items.filter(i => validRequests.has(i.requestId))
    .map(i => {
      const mt = matchType(i.matchType);
      let matchedUserId = null, matchedGroupId = null;
      if (mt === 'user') matchedUserId = i.matchedUserId;
      else if (mt === 'group') matchedGroupId = i.matchedGroupId;
      if (mt === 'user' && !ctx.usersByLegacyId.has(matchedUserId)) return null;
      if (mt === 'group' && !ctx.groupIds.has(matchedGroupId)) return null;
      return {
        id: i.id, request_id: i.requestId, match_type: mt, matched_user_id: matchedUserId,
        matched_group_id: matchedGroupId, score: clampScore(i.score),
        reason: truncateReason(i.reason), created_at: dateValue(i.createdAt),
      };
    }).filter(Boolean);
  if (!dryRun) {
    await target.upsert('matchmaking_items', itemRows, { batchSize });
    report.counts.matchmakingItems = itemRows.length;
  }
  report.skipped.matchmakingItems = items.length - itemRows.length;
}

export async function migrateActivity(ctx) {
  const { source, target, report, dryRun, batchSize } = ctx;
  const logs = await source.activityLogs();

  report.counts.sourceActivityLogs = logs.length;
  if (ctx.config.limit) logs.splice(0, ctx.config.limit);

  const rows = logs.map(l => ({
    id: l.id, model: l.model || '', action: l.action || '', record_id: l.recordId || null,
    user_id: ctx.usersByLegacyId.get(l.userId) ?? null,
    timestamp: dateValue(l.timestamp),
    details: normalizeDetails(l.details),
  }));
  if (!dryRun) {
    await target.upsert('activity_logs', rows, { batchSize });
    report.counts.activityLogs = rows.length;
  }
  report.skipped.activityLogs = logs.length - rows.length;
}

export async function migrateAvatars(ctx) {
  const { source, target, report, dryRun } = ctx;
  const images = await source.images();
  const imageById = new Map(images.map(im => [im.id, im]));

  report.counts.sourceImages = images.length;
  report.images = { planned: 0, uploaded: 0, failed: 0, errors: 0, items: [] };
  let uploaded = 0, failed = 0;
  const pending = [];
  for (const im of images) {
    if (!im.link) { report.skipped.images = (report.skipped.images || 0) + 1; continue; }
    const ownerId = im.creatorId && ctx.usersByLegacyId.has(im.creatorId) ? im.creatorId : null;
    if (!ownerId) { report.skipped.images = (report.skipped.images || 0) + 1; continue; }
    const path = `avatars/${ownerId}/${im.id}${extFromUrl(im.link)}`;
    pending.push({ im, path, ownerId });
  }

  if (dryRun) {
    report.images = { planned: pending.length };
    return;
  }

  for (const { im, path, ownerId } of pending) {
    try {
      const res = await fetch(im.link);
      if (!res.ok) { failed++; report.images.errors = (report.images.errors || 0) + 1;
        report.images.failed = (report.images.failed || 0) + 1;
        report.images.items = report.images.items || [];
        report.images.items.push({ imageId: im.id, ownerId, error: `HTTP ${res.status}` });
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      const up = await target.uploadAvatar(path, buffer, contentType);
      if (!up.ok) { failed++; report.images.errors = (report.images.errors || 0) + 1;
        report.images.items = report.images.items || [];
        report.images.items.push({ imageId: im.id, ownerId, error: up.reason });
        continue;
      }
      uploaded++;
      await target.updateProfile(ownerId, { avatar_path: path });
      report.images.uploaded = (report.images.uploaded || 0) + 1;
      report.images.items = report.images.items || [];
      report.images.items.push({ imageId: im.id, ownerId, path });
    } catch (err) {
      failed++;
      report.images.errors = (report.images.errors || 0) + 1;
      report.images.items = report.images.items || [];
      report.images.items.push({ imageId: im.id, ownerId, error: String(err) });
    }
  }
  report.counts.imagesUploaded = uploaded;
  report.skipped.images = failed;
}