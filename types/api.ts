import { Member, Organization } from "./user";
import { Message, GroupMessage, Group } from "./message";

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  message: string;
}

export interface StatsResponse {
  users: number;
  messages: number;
  notificationsUnopened: number;
  sentNotifications: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Member;
  message: string;
}

export interface LogoutRequest {
  id: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  userId: string;
}

export interface TopMember {
  user: Member;
  messageCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  opened: boolean;
  type: "system" | "alert" | "update";
}

export interface NotificationSetup {
  id: string;
  usage: string;
  message: string;
  link: string;
  updatedAt: string;
}

export interface WorkingSector {
  id: string;
  name: string;
}

export interface MatchMakingRequest {
  interests: string[];
  cohortId?: string;
}

export interface MatchMakingResponse {
  data: Member[];
  message: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  status: string;
  user: Member;
}

export interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  cohortId?: string;
}

export interface ImportUsersData {
  data: Record<string, unknown>[];
}

export interface UpdateUserData {
  userId: string;
  user: Partial<Member>;
}

export interface OrgUserData {
  userId: string;
  organizationId: string;
}
