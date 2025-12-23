-- portfolio_trackings 테이블에 notification_enabled 컬럼 추가
ALTER TABLE portfolio_trackings 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true;

