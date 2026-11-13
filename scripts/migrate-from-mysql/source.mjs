/**
 * Read-only MySQL source client.
 * Only SELECT statements are ever executed; parameters are bound.
 */
import mysql from 'mysql2/promise';

export class Source {
  constructor(config) {
    this.conn = null;
    this.cfg = config;
  }

  async connect() {
    const cfg = this.cfg.source;
    const conn = mysql.createConnection({
      uri: cfg.url,
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      multipleStatements: false,
      typeCast: (field, next) => {
        if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') return String(next());
        return next();
      },
    });
    await conn.connect();
    await conn.query('SET SESSION sql_mode=""');
    this.conn = conn;
    return this;
  }

  async close() {
    if (this.conn) {
      await this.conn.end();
      this.conn = null;
    }
  }

  async all(sql, params = []) {
    const [rows] = await this.conn.query(sql, params);
    return rows;
  }

  async count(sql, params = []) {
    const [rows] = await this.conn.query(sql, params);
    return Number(rows[0]?.n ?? rows[0]?.count ?? rows[0]?.n_rows ?? 0);
  }

  // --- Legacy source queries (Prisma model names / camelCase columns) ---
  async users() {
    return this.all(`SELECT id, firstName, middleName, lastName, email, phoneNumber, whatsappNumber,
      bio, linkedin, instagram, facebook, twitter, genderName, isRwandan, status,
      residentCountryId, stateId, residentDistrictId, residentSectorId, nearestLandmark,
      cohortId, trackId, roleId, password, profileImageId, createdAt, updatedAt
      FROM \`User\``);
  }
  async roles() { return this.all(`SELECT id, name FROM Role`); }
  async countries() { return this.all(`SELECT id, name, cId FROM Country`); }
  async states() { return this.all(`SELECT id, name, countryCode FROM State`); }
  async districts() { return this.all(`SELECT id, name FROM District`); }
  async sectors() { return this.all(`SELECT id, name, districtName FROM Sector`); }
  async genders() { return this.all(`SELECT id, name FROM Gender`); }
  async cohorts() { return this.all(`SELECT id, name, description FROM Cohort`); }
  async tracks() { return this.all(`SELECT id, name FROM Track`); }
  async workingSectors() { return this.all(`SELECT id, name FROM WorkingSector`); }
  async organizations() { return this.all(`SELECT id, name, countryId, stateId, districtId, sectorId,
    website, addedById, workingSectorId, createdAt, updatedAt FROM Organization`); }
  async userOrganizations() { return this.all(`SELECT id, organizationId, userId, relation, position,
    createdAt, updatedAt FROM User_Organization`); }
  async orgWorkingSectors() { return this.all(`SELECT id, organizationId, workingSectorId, userId,
    createdAt, updatedAt FROM Organization_WorkingSector`); }
  async groups() { return this.all(`SELECT id, name, description, interests, createdById FROM Group`); }
  async groupMembers() { return this.all(`SELECT id, groupId, userId, status, createdAt FROM GroupMember`); }
  async messages() { return this.all(`SELECT id, message, senderId, receiverId, \`public\` AS isPublic,
    createdAt, updatedAt FROM Message`); }
  async groupMessages() { return this.all(`SELECT id, groupId, senderId, content, createdAt FROM GroupMessage`); }
  async notifications() { return this.all(`SELECT id, receiverId, title, message, link, opened,
    createdAt, updatedAt FROM Notifications`); }
  async notificationSetups() { return this.all(`SELECT id, usage, message, link, updatedBy, updatedAt FROM NotificationSetup`); }
  async matchmakingRequests() { return this.all(`SELECT id, userId, description, aiSummary, aiNotes,
    aiResponse, interests, status, createdAt, updatedAt FROM MatchmakingRequest`); }
  async matchmakingItems() { return this.all(`SELECT id, requestId, matchedUserId, matchedGroupId,
    matchType, score, reason, createdAt FROM MatchmakingItem`); }
  async activityLogs() { return this.all(`SELECT id, model, action, recordId, userId, timestamp,
    details FROM ActivityLog`); }
  async images() { return this.all(`SELECT id, link, name, creatorId, createdAt FROM Image`); }
  async raw(sql, params = []) { return this.all(sql, params); }
}