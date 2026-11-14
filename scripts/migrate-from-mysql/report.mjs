/**
 * Write the migration report as JSON and Markdown.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { redact } from './config.mjs';

export function redactConfig(config) {
  return {
    dryRun: config.dryRun,
    limit: config.limit,
    batchSize: config.batchSize,
    steps: config.steps,
    confirmProduction: config.confirmProduction,
    reportDir: config.reportDir,
    skipChecksum: config.skipChecksum,
    source: {
      host: config.source.host,
      port: config.source.port,
      user: config.source.user,
      password: redact(config.source.password),
      database: config.source.database,
    },
    target: {
      url: config.target.url,
      serviceRoleKey: redact(config.target.serviceRoleKey),
      avatarsBucket: config.target.avatarsBucket,
    },
    verifyPasswordEmail: config.verifyPasswordEmail,
    verifyPassword: config.verifyPassword ? '<set>' : '<unset>',
  };
}

export function writeReport(dir, report) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'migration-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(path.join(dir, 'migration-report.md'), markdown(report));
}

function markdown(report) {
  const c = report.counts || {};
  const ch = report.checksums || {};
  const lines = [];
  lines.push('# Migration report');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Dry run: ${report.dryRun}`);
  lines.push(`Duration: ${report.durationMs} ms`);
  lines.push('');
  lines.push('## Configuration');
  lines.push(`- Source: ${report.config.source.host}:${report.config.source.port}/${report.config.source.database}`);
  lines.push(`- Target: ${report.config.target.url}`);
  lines.push(`- Steps: ${report.config.steps.join(', ') || '(all)'}`);
  lines.push('');
  lines.push('## Counts');
  const rows = [
    ['Users (source)', c.sourceUsers],
    ['Profiles (target)', c.targetProfiles],
    ['Organizations (source)', c.sourceOrgs],
    ['Organizations (target)', c.targetOrganizations],
    ['User orgs (source)', c.sourceUserOrgs],
    ['User orgs (target)', c.targetUserOrgs],
    ['Groups (source)', c.sourceGroups],
    ['Group conversations (target)', c.targetGroupConversations],
    ['Group members (source)', c.sourceGroupMembers],
    ['Conversation members (target)', c.targetConversationMembers],
    ['Messages (source)', c.sourceMessages],
    ['Group messages (source)', c.sourceGroupMessages],
    ['Messages (target)', c.targetMessages],
    ['Notifications (source)', c.sourceNotifications],
    ['Notifications (target)', c.targetNotifications],
    ['Notif. setups (source)', c.sourceNotifSetups],
    ['Notif. templates (target)', c.targetNotifTemplates],
    ['Match requests (source)', c.sourceMatchRequests],
    ['Match requests (target)', c.targetMatchRequests],
    ['Match items (source)', c.sourceMatchItems],
    ['Match items (target)', c.targetMatchItems],
    ['Activity logs (source)', c.sourceActivityLogs],
    ['Activity logs (target)', c.targetActivityLogs],
    ['Images (source)', c.sourceImages],
    ['Avatars uploaded', c.targetImagesUploaded],
  ];
  for (const [label, value] of rows) lines.push(`- ${label}: ${value}`);
  lines.push('');
  lines.push('## Skipped');
  const s = report.skipped || {};
  for (const [k, v] of Object.entries(s)) {
    if (v) lines.push(`- ${k}: ${v}`);
  }
  lines.push('');
  lines.push('## Checksums');
  for (const [table, r] of Object.entries(ch)) {
    lines.push(`- ${table}: ${r.match ? 'MATCH' : 'MISMATCH'} (source=${r.source.slice(0,12)}..., target=${r.target.slice(0,12)}...)`);
  }
  lines.push('');
  lines.push('## Errors');
  if (report.errors && report.errors.length) {
    for (const e of report.errors) lines.push(`- ${e.table || 'unknown'} id=${e.id} email=${e.email || '-'}: ${e.error}`);
  } else {
    lines.push('- none');
  }
  lines.push('');
  lines.push('## Images');
  if (report.images) {
    lines.push(`- Planned: ${report.images.planned || 0}`);
    lines.push(`- Uploaded: ${report.images.uploaded || 0}`);
    lines.push(`- Failed: ${report.images.failed || 0}`);
  }
  lines.push('');
  return lines.join('\n');
}