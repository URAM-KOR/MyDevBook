-- portfolios 테이블에서 weather_status와 encouragement_message 컬럼 제거
-- (이제 portfolio_trackings 테이블에서 관리)
ALTER TABLE portfolios 
DROP COLUMN IF EXISTS weather_status,
DROP COLUMN IF EXISTS encouragement_message;

