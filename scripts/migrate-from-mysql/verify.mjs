/**
 * Verification: compare source counts/checksums against migrated target rows.
 */
import { checksumRows, mapRole, mapStatus, dateValue } from './transform.mjs';
import { uuidv5 } from './uuid.mjs';

export async function fetchAllRows(target, table, columns) {
  const cols = columns.join(',');
  const rows = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await target.supabase.from(table).select(cols).range(from, from + page - 1);
    if (error) throw new Error(`verify ${table}: ${error.message ?? String(error)}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

export async function tableCount(target, table) {
  const { count, error } = await target.supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`count ${table}: ${error.message ?? String(error)}`);
  return count ?? 0;
}

export function profileChecksumRow(u, ctx) {
  const roleName = ctx.roleNameById ? ctx.roleNameById.get(u.roleId) : undefined;
  return {
    id: u.id, email: u.email, first_name: u.firstName, last_name: u.lastName,
    status: mapStatus(u.status), role: mapRole(u.roleId, roleName),
    cohort_id: ctx.maps.cohortById.get(u.cohortId) ?? null,
    track_id: ctx.maps.trackById.get(u.trackId) ??
      ctx.maps.trackByName.get(String(u.trackId ?? '').toLowerCase()) ?? null,
    country_id: ctx.maps.countryById.get(u.residentCountryId) ??
      ctx.maps.countryByName.get(String(u.residentCountryId ?? '').toLowerCase()) ?? null,
    district_id: ctx.maps.districtByName.get(String(u.residentDistrictId ?? '').toLowerCase()) ?? null,
    sector_id: ctx.maps.sectorById.get(u.residentSectorId) ?? null,
    created_at: dateValue(u.createdAt),
  };
}

const FIELDS = {
  profiles: ['id','email','first_name','last_name','status','role','cohort_id','track_id','country_id','district_id','sector_id','created_at'],
  notifications: ['id','receiver_id','title','message','opened','created_at'],
  matchmaking_requests: ['id','user_id','status','interests','created_at'],
  matchmaking_items: ['id','request_id','match_type','matched_user_id','matched_group_id','score','created_at'],
  activity_logs: ['id','model','action','record_id','user_id','timestamp'],
};

export async function verify(ctx) {
  const { source, target, report, dryRun } = ctx;
  if (dryRun) return {};
  const counts = {};
  const checksums = {};

  const users = await source.users();
  const orgs = await source.organizations();
  const userOrgs = await source.userOrganizations();
  const groups = await source.groups();
  const groupMembers = await source.groupMembers();
  const messages = await source.messages();
  const groupMessages = await source.groupMessages();
  const notifications = await source.notifications();
  const notifSetups = await source.notificationSetups();
  const matchRequests = await source.matchmakingRequests();
  const matchItems = await source.matchmakingItems();
  const activityLogs = await source.activityLogs();
  const images = await source.images();

  counts.sourceUsers = users.length;
  counts.targetProfiles = await tableCount(target, 'profiles');
  counts.sourceOrgs = orgs.length;
  counts.targetOrganizations = await tableCount(target, 'organizations');
  counts.sourceUserOrgs = userOrgs.length;
  counts.targetUserOrgs = await tableCount(target, 'user_organizations');
  counts.sourceGroups = groups.length;
  const convRows = await fetchAllRows(target, 'conversations', ['id','type']);
  counts.targetGroupConversations = convRows.filter(r => r.type === 'group').length;
  counts.sourceGroupMembers = groupMembers.length;
  counts.targetConversationMembers = await tableCount(target, 'conversation_members');
  counts.sourceMessages = messages.length;
  counts.sourceGroupMessages = groupMessages.length;
  counts.targetMessages = await tableCount(target, 'messages');
  counts.sourceNotifications = notifications.length;
  counts.targetNotifications = await tableCount(target, 'notifications');
  counts.sourceNotifSetups = notifSetups.length;
  counts.targetNotifTemplates = await tableCount(target, 'notification_templates');
  counts.sourceMatchRequests = matchRequests.length;
  counts.targetMatchRequests = await tableCount(target, 'matchmaking_requests');
  counts.sourceMatchItems = matchItems.length;
  counts.targetMatchItems = await tableCount(target, 'matchmaking_items');
  counts.sourceActivityLogs = activityLogs.length;
  counts.targetActivityLogs = await tableCount(target, 'activity_logs');
  counts.sourceImages = images.length;
  counts.targetImagesUploaded = report.counts.imagesUploaded || 0;

  // Checksums
  const usersTransformed = users.map(u => profileChecksumRow(u, ctx));
  const targetProfiles = await fetchAllRows(target, 'profiles', FIELDS.profiles);
  checksums.profiles = {
    source: checksumRows(usersTransformed, FIELDS.profiles),
    target: checksumRows(targetProfiles, FIELDS.profiles),
    match: checksumRows(usersTransformed, FIELDS.profiles) === checksumRows(targetProfiles, FIELDS.profiles),
  };

  const notifsTransformed = notifications.filter(n => ctx.usersByLegacyId.has(n.receiverId)).map(n => ({
    id: n.id, receiver_id: n.receiverId, title: n.title || '', message: n.message || '', opened: !!n.opened, created_at: dateValue(n.createdAt),
  }));
  const targetNotifs = await fetchAllRows(target, 'notifications', FIELDS.notifications);
  checksums.notifications = {
    source: checksumRows(notifsTransformed, FIELDS.notifications),
    target: checksumRows(targetNotifs, FIELDS.notifications),
    match: checksumRows(notifsTransformed, FIELDS.notifications) === checksumRows(targetNotifs, FIELDS.notifications),
  };

  const reqTransformed = matchRequests.map(r => ({
    id: r.id, user_id: r.userId, status: mapStatus(r.status), interests: r.interests || '', created_at: dateValue(r.createdAt),
  }));
  const targetReqs = await fetchAllRows(target, 'matchmaking_requests', FIELDS.matchmaking_requests);
  checksums.matchmakingRequests = {
    source: checksumRows(reqTransformed, FIELDS.matchmaking_requests),
    target: checksumRows(targetReqs, FIELDS.matchmaking_requests),
    match: checksumRows(reqTransformed, FIELDS.matchmaking_requests) === checksumRows(targetReqs, FIELDS.matchmaking_requests),
  };

  const itemTransformed = matchItems.filter(i => ctx.usersByLegacyId.has(i.matchedUserId) || ctx.groupIds.has(i.matchedGroupId))
    .map(i => ({ id: i.id, request_id: i.requestId, match_type: i.matchType, matched_user_id: i.matchedUserId, matched_group_id: i.matchedGroupId, score: i.score, created_at: dateValue(i.createdAt) }));
  const targetItems = await fetchAllRows(target, 'matchmaking_items', FIELDS.matchmaking_items);
  checksums.matchmakingItems = {
    source: checksumRows(itemTransformed, FIELDS.matchmaking_items),
    target: checksumRows(targetItems, FIELDS.matchmaking_items),
    match: checksumRows(itemTransformed, FIELDS.matchmaking_items) === checksumRows(targetItems, FIELDS.matchmaking_items),
  };

  const actTransformed = activityLogs.map(l => ({ id: l.id, model: l.model, action: l.action, record_id: l.recordId, user_id: l.userId, timestamp: dateValue(l.timestamp) }));
  const targetActs = await fetchAllRows(target, 'activity_logs', FIELDS.activity_logs);
  checksums.activityLogs = {
    source: checksumRows(actTransformed, FIELDS.activity_logs),
    target: checksumRows(targetActs, FIELDS.activity_logs),
    match: checksumRows(actTransformed, FIELDS.activity_logs) === checksumRows(targetActs, FIELDS.activity_logs),
  };

  report.counts = { ...report.counts, ...counts };
  report.checksums = checksums;

  const mismatches = Object.entries(checksums).filter(([, c]) => !c.match).map(([t]) => t);
  return { counts, checksums, mismatches };
}