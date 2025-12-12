// PortfolioTracking 관련 타입 정의
// PortfolioTracking은 portfolio.ts에서 정의됨 - 중복 방지
export type { PortfolioTracking } from './portfolio';

export interface TrackingCreateDto {
  portfolioId: string;
  url: string;
  logicPrompt: string;
}

export interface TrackingUpdateDto {
  url?: string;
  logicPrompt?: string;
}
