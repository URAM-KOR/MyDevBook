-- portfolio_trackings 테이블에 weather_status와 encouragement_message 컬럼 추가
ALTER TABLE portfolio_trackings 
ADD COLUMN IF NOT EXISTS weather_status VARCHAR(50) DEFAULT 'healthy',
ADD COLUMN IF NOT EXISTS encouragement_message TEXT;

