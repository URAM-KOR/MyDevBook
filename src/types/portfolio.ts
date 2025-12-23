// Portfolio 관련 타입 정의

// 포트폴리오 관리 상태
// healthy: 잘 관리됨 ✨
// alert: 변화 감지! 🔔
// hungry: 관리 필요 😢
// cobweb: 오래 방치됨 🕸️
// infested: 심각하게 방치됨 🪳
export type WeatherStatus = 'healthy' | 'alert' | 'hungry' | 'cobweb' | 'infested';

export interface PortfolioTracking {
  id: string;
  portfolio_id: string;
  url: string;
  logic_prompt: string;
  // GPT 응답으로 업데이트되는 필드
  current_value?: string | null;
  weather_status?: WeatherStatus;
  encouragement_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  status: string;
  order: number;
  created_at: string;
  updated_at: string;
  tracking?: PortfolioTracking | null;
  weather_status?: WeatherStatus;
  // 트래킹 정보 (조회 시 포함)
  tracking_url?: string | null;
  tracking_prompt?: string | null;
  auth_type?: 'none' | 'github' | 'bearer';
  current_value?: string | null;
  target_key?: string | null;
  encouragement_message?: string | null;
}

export interface PortfolioCreateDto {
  title: string;
  description?: string;
  content?: string;
  status?: string;
  order?: number;
  image_url?: string;
  tracking_url?: string;
  tracking_prompt?: string;
}

export interface PortfolioUpdateDto {
  title?: string;
  description?: string;
  content?: string;
  status?: string;
  order?: number;
  image_url?: string;
}
