import { Portfolio } from '@/types';
import { card, cardStyles, colors, typography, spacing, button } from '@/styles/design-tokens';
import WeatherOverlay, { getWeatherConfig, WeatherStatus } from './WeatherOverlay';
import { motion } from 'framer-motion';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onEdit: (portfolio: Portfolio) => void;
  onDelete: (id: string) => void;
}

export default function PortfolioCard({ portfolio, onEdit, onDelete }: PortfolioCardProps) {
  const weatherStatus: WeatherStatus = portfolio.weather_status || 'healthy';
  const weatherConfig = getWeatherConfig(weatherStatus);
  const needsAttention = weatherStatus !== 'healthy';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1, zIndex: 10 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'relative',
          width: '140px',
          height: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#1a1a1a',
          boxShadow: needsAttention 
            ? `0 0 0 2px ${weatherConfig.borderColor}, 0 8px 32px rgba(0, 0, 0, 0.6)`
            : '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`netflix-card-mobile ${weatherStatus === 'alert' ? 'card-shake' : ''} ${weatherStatus === 'hungry' ? 'card-hungry' : ''}`}
      >
        {/* 이미지 영역 - 넷플릭스 모바일 스타일 */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '140px', 
          overflow: 'hidden',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={portfolio.image_url || ''}
            alt={portfolio.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              filter: weatherStatus === 'cobweb' || weatherStatus === 'infested' ? 'grayscale(50%) brightness(0.7)' : 'brightness(0.9)',
              transition: 'filter 0.3s ease',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          {/* 그라데이션 오버레이 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
            }}
          />
          <WeatherOverlay status={weatherStatus} />
        </div>

        {/* 콘텐츠 영역 - 넷플릭스 모바일 스타일 (간소화) */}
        <div style={{ 
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a',
          height: '60px',
        }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: 600,
                margin: 0,
                marginBottom: '2px',
                color: '#ffffff',
                lineHeight: '1.2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {portfolio.title}
            </h3>
            {portfolio.tracking_prompt && (
              <p
                style={{
                  fontSize: '8px',
                  color: '#a3a3a3',
                  margin: 0,
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={portfolio.tracking_prompt}
              >
                🎯 {portfolio.tracking_prompt}
              </p>
            )}
            {portfolio.current_value && (
              <p
                style={{
                  fontSize: '8px',
                  color: '#71717a',
                  margin: 0,
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={portfolio.current_value}
              >
                📊 {portfolio.current_value}
              </p>
            )}
            {portfolio.encouragement_message && (
              <p
                style={{
                  fontSize: '8px',
                  color: weatherStatus === 'healthy' ? '#a3f4a3' : weatherStatus === 'alert' ? '#fbbf24' : '#f87171',
                  margin: 0,
                  fontStyle: 'italic',
                  lineHeight: '1.3',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
                title={portfolio.encouragement_message}
              >
                ✨ {portfolio.encouragement_message}
              </p>
            )}
          </div>
          
          {/* 액션 버튼 - 모바일에서는 아이콘만 */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(portfolio);
              }}
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ✏️
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(portfolio.id);
              }}
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              🗑️
            </motion.button>
          </div>
        </div>
      </motion.div>

      <style>{`
        .netflix-card-mobile:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8) !important;
        }
        
        @media (min-width: 768px) {
          .netflix-card-mobile {
            width: 200px;
            height: 280px;
          }
          
          .netflix-card-mobile > div:first-child {
            height: 200px;
          }
          
          .netflix-card-mobile > div:last-child {
            height: 80px;
            padding: 12px;
          }
        }
        
        @keyframes cardShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes cardHungry {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.98); }
        }
        
        .card-shake {
          animation: cardShake 0.8s ease-in-out infinite;
        }
        
        .card-hungry {
          animation: cardHungry 2s ease-in-out infinite;
        }
        
        .card-shake:hover,
        .card-hungry:hover {
          animation: none;
        }
      `}</style>
    </>
  );
}
