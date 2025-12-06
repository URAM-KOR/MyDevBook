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
  last_status: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  status: string;
  order: number;
  created_at: string;
  updated_at: string;
  tracking?: PortfolioTracking | null;
  weather_status?: WeatherStatus;
}

export interface PortfolioCreateDto {
  title: string;
  content?: string;
  status?: string;
  order?: number;
  image_url?: string;
  tracking_url?: string;
  tracking_prompt?: string;
}

export interface PortfolioUpdateDto {
  title?: string;
  content?: string;
  status?: string;
  order?: number;
  image_url?: string;
}
