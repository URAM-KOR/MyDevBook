import { Portfolio } from '@/types';
import { card, cardStyles, colors, typography, spacing, button } from '@/styles/design-tokens';
import WeatherOverlay, { getWeatherConfig, WeatherStatus } from './WeatherOverlay';

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
      <div
        style={{
          position: 'relative',
          minWidth: card.minWidth,
          borderRadius: card.borderRadius,
          boxShadow: needsAttention 
            ? `0 0 0 3px ${weatherConfig.borderColor}, ${cardStyles.base.boxShadow}`
            : cardStyles.base.boxShadow,
          transition: cardStyles.base.transition,
          backgroundColor: weatherConfig.bgTint !== 'transparent' ? weatherConfig.bgTint : 'white',
          overflow: 'hidden',
        }}
        className={`hover:shadow-lg ${weatherStatus === 'alert' ? 'card-shake' : ''} ${weatherStatus === 'hungry' ? 'card-hungry' : ''}`}
      >
        {/* 이미지 영역 */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src={portfolio.image_url || ''}
            alt={portfolio.title}
            style={{
              width: '100%',
              height: card.imageHeight,
              objectFit: 'cover',
              filter: weatherStatus === 'cobweb' || weatherStatus === 'infested' ? 'grayscale(50%)' : 'none',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          <WeatherOverlay status={weatherStatus} />
        </div>

        {/* 콘텐츠 영역 */}
        <div style={{ padding: card.padding }}>
          <h3
            style={{
              fontSize: typography.title.size,
              fontWeight: typography.title.weight,
              marginBottom: spacing.sm,
              color: weatherStatus === 'infested' ? colors.gray[500] : 'inherit',
            }}
          >
            {portfolio.title}
          </h3>
          {/* 추적 정보 표시 */}
          {portfolio.target_key && (
            <div
              style={{
                padding: spacing.sm,
                backgroundColor: colors.gray[50],
                borderRadius: '8px',
                marginBottom: spacing.md,
              }}
            >
              <p style={{ fontSize: '12px', color: colors.gray[500], margin: 0 }}>
                🎯 {portfolio.target_key}
              </p>
              {portfolio.current_value && (
                <p style={{ fontSize: '16px', fontWeight: 600, color: colors.blue[600], margin: '4px 0 0' }}>
                  {portfolio.current_value}
                </p>
              )}
              {portfolio.tracking_prompt && (
                <p style={{ fontSize: '11px', color: colors.gray[400], margin: '8px 0 0', fontStyle: 'italic' }}>
                  🔔 알림: {portfolio.tracking_prompt}
                </p>
              )}
            </div>
          )}
          
          {portfolio.content && !portfolio.target_key && (
            <p
              style={{
                fontSize: typography.description.size,
                color: colors.gray[600],
                marginBottom: spacing.md,
                display: '-webkit-box',
                WebkitLineClamp: typography.description.maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {portfolio.content}
            </p>
          )}
          <div style={{ display: 'flex', gap: button.gap }}>
            <button
              onClick={() => onEdit(portfolio)}
              style={{
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: colors.blue[100],
                color: colors.blue[700],
                borderRadius: button.borderRadius,
                fontSize: typography.description.size,
                border: 'none',
                cursor: 'pointer',
              }}
              className="hover:bg-blue-200"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(portfolio.id)}
              style={{
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: button.borderRadius,
                fontSize: typography.description.size,
                border: 'none',
                cursor: 'pointer',
              }}
              className="hover:bg-red-200"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <style>{`
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
