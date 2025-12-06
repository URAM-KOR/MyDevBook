// PushSubscription 관련 타입 정의
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionCreateDto {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionUpdateDto {
  endpoint?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

