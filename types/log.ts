export interface ActivityLog {
  id: string;
  model: string;
  action: string;
  recordId?: string;
  userId?: string;
  timestamp: string;
  details?: any;
}

export interface RecentActivityResponse {
  data: ActivityLog[];
  count: number;
  message: string;
}
