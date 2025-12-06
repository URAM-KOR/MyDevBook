// PortfolioTracking 관련 타입 정의
export interface PortfolioTracking {
  id: string;
  portfolio_id: string;
  url: string;
  last_status: string | null;
  logic_prompt: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingCreateDto {
  portfolioId: string;
  url: string;
  logicPrompt: string;
}

export interface TrackingUpdateDto {
  url?: string;
  logicPrompt?: string;
}

