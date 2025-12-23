-- portfolio_trackings 테이블에서 배치 프로세스 메타데이터 필드 제거
-- (GPT 응답과 무관한 필드)
ALTER TABLE portfolio_trackings 
DROP COLUMN IF EXISTS last_status,
DROP COLUMN IF EXISTS last_checked_at;

