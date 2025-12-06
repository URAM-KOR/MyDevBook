import { colors } from '@/styles/design-tokens';

export type WeatherStatus = 'healthy' | 'hungry' | 'cobweb' | 'infested' | 'alert';

interface WeatherOverlayProps {
  status: WeatherStatus;
}

const weatherConfig = {
  healthy: {
    emoji: '✨',
    label: '건강함',
    overlayColor: 'transparent',
    borderColor: 'transparent',
    bgTint: 'transparent',
    animate: '',
  },
  alert: {
    emoji: '🔔',
    label: '변화 감지!',
    overlayColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    bgTint: 'rgba(239, 68, 68, 0.05)',
    animate: 'shake',
  },
  hungry: {
    emoji: '😢',
    label: '배고파요...',
    overlayColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    bgTint: 'rgba(245, 158, 11, 0.05)',
    animate: 'bounce',
  },
  cobweb: {
    emoji: '🕸️',
    label: '거미줄 쳤어요',
    overlayColor: 'rgba(156, 163, 175, 0.25)',
    borderColor: colors.gray[400],
    bgTint: 'rgba(156, 163, 175, 0.1)',
    animate: 'fade',
  },
  infested: {
    emoji: '🪳',
    label: '벌레가 살아요',
    overlayColor: 'rgba(55, 65, 81, 0.3)',
    borderColor: '#374151',
    bgTint: 'rgba(55, 65, 81, 0.1)',
    animate: 'crawl',
  },
};

export function getWeatherConfig(status: WeatherStatus) {
  return weatherConfig[status];
}

export default function WeatherOverlay({ status }: WeatherOverlayProps) {
  const config = weatherConfig[status];
  
  if (status === 'healthy') return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: config.overlayColor,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      
      {/* 상태 아이콘 */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          fontSize: '32px',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
        className={`weather-icon weather-${config.animate}`}
      >
        {config.emoji}
      </div>

      {/* 상태 라벨 */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          padding: '4px 10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          zIndex: 10,
          letterSpacing: '0.5px',
        }}
      >
        {config.label}
      </div>

      {/* 거미줄 효과 */}
      {status === 'cobweb' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60px',
            height: '60px',
            opacity: 0.6,
            zIndex: 6,
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M0 0 L60 60 M0 20 L40 60 M20 0 L60 40 M0 40 L20 60 M40 0 L60 20" 
              stroke="rgba(200,200,200,0.8)" strokeWidth="1"/>
            <path d="M0 0 Q30 30 0 60 M0 0 Q30 30 60 0" 
              stroke="rgba(200,200,200,0.6)" strokeWidth="0.5"/>
          </svg>
        </div>
      )}

      {/* 벌레 추가 이펙트 */}
      {status === 'infested' && (
        <>
          <div className="bug bug-1">🐜</div>
          <div className="bug bug-2">🪳</div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        
        @keyframes fade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes crawl {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-5deg); }
          75% { transform: translateX(3px) rotate(5deg); }
        }
        
        @keyframes bugMove1 {
          0% { top: 20%; left: 10%; }
          25% { top: 40%; left: 30%; }
          50% { top: 30%; left: 50%; }
          75% { top: 50%; left: 20%; }
          100% { top: 20%; left: 10%; }
        }
        
        @keyframes bugMove2 {
          0% { bottom: 30%; right: 20%; }
          33% { bottom: 50%; right: 40%; }
          66% { bottom: 20%; right: 30%; }
          100% { bottom: 30%; right: 20%; }
        }
        
        .weather-bounce { animation: bounce 1.5s ease-in-out infinite; }
        .weather-shake { animation: shake 0.5s ease-in-out infinite; }
        .weather-fade { animation: fade 3s ease-in-out infinite; }
        .weather-crawl { animation: crawl 2s ease-in-out infinite; }
        
        .bug {
          position: absolute;
          font-size: 14px;
          z-index: 7;
          pointer-events: none;
          opacity: 0.8;
        }
        
        .bug-1 {
          animation: bugMove1 8s linear infinite;
        }
        
        .bug-2 {
          animation: bugMove2 6s linear infinite;
        }
      `}</style>
    </>
  );
}
