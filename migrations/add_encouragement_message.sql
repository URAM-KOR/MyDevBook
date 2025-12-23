-- portfolios 테이블에 encouragement_message 컬럼 추가
ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS encouragement_message TEXT;

