// Notification 관련 타입 정의
export interface Notification {
  id: string;
  user_id: string;
  tracking_id: string | null;
  type: string;
  payload: Record<string, any> | null;
  read: number; // SQLite boolean (0 or 1)
  created_at: string;
  sent_at: string | null;
}

export interface NotificationCreateDto {
  userId: string;
  trackingId?: string;
  type: string;
  payload?: Record<string, any>;
}

