import { colors } from '@/styles/design-tokens';

export type WeatherStatus = 'healthy' | 'hungry' | 'cobweb' | 'infested' | 'alert';

interface WeatherOverlayProps {
  status: WeatherStatus;
}

export const weatherConfig = {
  healthy: {
    emoji: '💪',
    label: '✨ 완벽해요!',
    overlayColor: 'rgba(34, 197, 94, 0.05)',
    borderColor: '#22c55e',
    bgTint: 'rgba(34, 197, 94, 0.03)',
    animate: 'sparkle',
    glow: '0 0 20px rgba(34, 197, 94, 0.4)',
  },
  alert: {
    emoji: '🚨',
    label: '⚠️ 주의 필요!',
    overlayColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    bgTint: 'rgba(239, 68, 68, 0.08)',
    animate: 'shake',
    glow: '0 0 20px rgba(239, 68, 68, 0.6)',
  },
  hungry: {
    emoji: '😭',
    label: '배고파요...',
    overlayColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
    bgTint: 'rgba(245, 158, 11, 0.08)',
    animate: 'bounce',
    glow: '0 0 15px rgba(245, 158, 11, 0.5)',
  },
  cobweb: {
    emoji: '🕷️',
    label: '🕸️ 거미줄 쳤어요',
    overlayColor: 'rgba(156, 163, 175, 0.35)',
    borderColor: colors.gray[400],
    bgTint: 'rgba(156, 163, 175, 0.15)',
    animate: 'fade',
    glow: '',
  },
  infested: {
    emoji: '☠️',
    label: '🪳 벌레 천국',
    overlayColor: 'rgba(55, 65, 81, 0.4)',
    borderColor: '#374151',
    bgTint: 'rgba(55, 65, 81, 0.15)',
    animate: 'crawl',
    glow: '0 0 10px rgba(0, 0, 0, 0.5)',
  },
};

export function getWeatherConfig(status: WeatherStatus) {
  return weatherConfig[status];
}

export default function WeatherOverlay({ status }: WeatherOverlayProps) {
  const config = weatherConfig[status];

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

      {/* 상태 아이콘 - 더 크고 격하게! */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '42px',
          zIndex: 10,
          filter: config.glow
            ? `drop-shadow(${config.glow})`
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
        className={`weather-icon weather-${config.animate}`}
      >
        {config.emoji}
      </div>

      {/* 상태 라벨 - 더 눈에 띄게! */}
      <div
        className="label-blink"
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          zIndex: 10,
          textAlign: 'center',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: 'white',
        }}
        data-status={status}
      >
        {config.label}
      </div>

      {/* 거미줄 효과 - 코너마다! */}
      {status === 'cobweb' && (
        <>
          {/* 왼쪽 위 거미줄 */}
          <div className="cobweb cobweb-tl">
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M0 0 L80 80 M0 15 L65 80 M15 0 L80 65 M0 30 L50 80 M30 0 L80 50 M0 50 L30 80 M50 0 L80 30"
                stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <path d="M0 0 C40 20 20 40 0 80 M0 0 C20 40 40 20 80 0"
                stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>
          </div>
          {/* 오른쪽 위 거미줄 */}
          <div className="cobweb cobweb-tr">
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M80 0 L0 80 M80 15 L15 80 M65 0 L0 65"
                stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </svg>
          </div>
          {/* 먼지 파티클 */}
          <div className="dust dust-1">•</div>
          <div className="dust dust-2">•</div>
          <div className="dust dust-3">•</div>
        </>
      )}

      {/* 벌레 추가 이펙트 - 더 많이! */}
      {status === 'infested' && (
        <>
          <div className="bug bug-1">🐜</div>
          <div className="bug bug-2">🪳</div>
          <div className="bug bug-3">🐛</div>
          <div className="bug bug-4">🦗</div>
          <div className="bug bug-5">🐜</div>
        </>
      )}

      {/* hungry 상태 - 눈물 이펙트 */}
      {status === 'hungry' && (
        <>
          <div className="tear tear-1">💧</div>
          <div className="tear tear-2">💧</div>
        </>
      )}

      {/* alert 상태 - 경고등 */}
      {status === 'alert' && (
        <div className="alert-flash" />
      )}

      {/* healthy 상태 - 반짝이는 별 */}
      {status === 'healthy' && (
        <>
          <div className="sparkle sparkle-1">✨</div>
          <div className="sparkle sparkle-2">⭐</div>
          <div className="sparkle sparkle-3">✨</div>
          <div className="healthy-glow" />
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(-15deg) scale(1.1); }
          20% { transform: rotate(15deg) scale(1.1); }
          30% { transform: rotate(-15deg) scale(1); }
          40% { transform: rotate(15deg) scale(1); }
          50% { transform: rotate(0deg) scale(1.2); }
          60% { transform: rotate(-10deg) scale(1); }
          70% { transform: rotate(10deg) scale(1); }
          80% { transform: rotate(-5deg) scale(1.1); }
          90% { transform: rotate(5deg) scale(1.1); }
        }
        
        @keyframes fade {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes crawl {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-10deg); }
          50% { transform: translateX(0) rotate(0deg) scale(1.1); }
          75% { transform: translateX(5px) rotate(10deg); }
        }
        
        @keyframes bugMove1 {
          0% { top: 20%; left: 10%; transform: rotate(0deg); }
          25% { top: 60%; left: 40%; transform: rotate(90deg); }
          50% { top: 40%; left: 70%; transform: rotate(180deg); }
          75% { top: 70%; left: 20%; transform: rotate(270deg); }
          100% { top: 20%; left: 10%; transform: rotate(360deg); }
        }
        
        @keyframes bugMove2 {
          0% { top: 60%; left: 60%; }
          33% { top: 30%; left: 80%; }
          66% { top: 50%; left: 40%; }
          100% { top: 60%; left: 60%; }
        }
        
        @keyframes bugMove3 {
          0% { top: 80%; left: 30%; }
          50% { top: 50%; left: 60%; }
          100% { top: 80%; left: 30%; }
        }
        
        @keyframes bugMove4 {
          0% { top: 30%; left: 70%; transform: scaleX(-1); }
          50% { top: 70%; left: 30%; transform: scaleX(1); }
          100% { top: 30%; left: 70%; transform: scaleX(-1); }
        }
        
        @keyframes bugMove5 {
          0% { top: 45%; left: 45%; }
          25% { top: 20%; left: 60%; }
          50% { top: 65%; left: 75%; }
          75% { top: 35%; left: 25%; }
          100% { top: 45%; left: 45%; }
        }
        
        @keyframes tearFall {
          0% { top: 30%; opacity: 0; }
          20% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
        
        @keyframes alertFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        
        @keyframes labelPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
        }
        
        @keyframes labelBlinkAlert {
          0%, 100% { 
            opacity: 0;
            background-color: rgba(239, 68, 68, 0);
          }
          50% { 
            opacity: 1;
            background-color: rgba(239, 68, 68, 0.9);
          }
        }
        
        @keyframes labelBlinkInfested {
          0%, 100% { 
            opacity: 0;
            background-color: rgba(55, 65, 81, 0);
          }
          50% { 
            opacity: 1;
            background-color: rgba(55, 65, 81, 0.9);
          }
        }
        
        @keyframes labelBlinkDefault {
          0%, 100% { 
            opacity: 0;
            background-color: rgba(0, 0, 0, 0);
          }
          50% { 
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.75);
          }
        }
        
        .label-blink[data-status="alert"] {
          animation: labelBlinkAlert 2s ease-in-out infinite;
        }
        .label-blink[data-status="infested"] {
          animation: labelBlinkInfested 2s ease-in-out infinite;
        }
        .label-blink[data-status="hungry"],
        .label-blink[data-status="cobweb"],
        .label-blink[data-status="healthy"] {
          animation: labelBlinkDefault 2s ease-in-out infinite;
        }
        
        @keyframes sparkleAnim {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
        }
        
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-15px) scale(1.2); opacity: 1; }
          90% { opacity: 1; }
        }
        
        @keyframes healthyGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .weather-sparkle { animation: sparkleAnim 2s ease-in-out infinite; }
        .weather-bounce { animation: bounce 1s ease-in-out infinite; }
        .weather-shake { animation: shake 0.4s ease-in-out infinite; }
        .weather-fade { animation: fade 2s ease-in-out infinite; }
        .weather-crawl { animation: crawl 1.5s ease-in-out infinite; }
        
        .sparkle {
          position: absolute;
          font-size: 20px;
          z-index: 7;
          pointer-events: none;
          animation: sparkleFloat 3s ease-in-out infinite;
        }
        .sparkle-1 { top: 20%; left: 20%; animation-delay: 0s; }
        .sparkle-2 { top: 40%; left: 70%; animation-delay: 1s; font-size: 16px; }
        .sparkle-3 { top: 60%; left: 40%; animation-delay: 2s; font-size: 14px; }
        
        .healthy-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 70%);
          animation: healthyGlow 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 4;
        }
        
        .bug {
          position: absolute;
          font-size: 16px;
          z-index: 7;
          pointer-events: none;
        }
        
        .bug-1 { animation: bugMove1 6s linear infinite; }
        .bug-2 { animation: bugMove2 5s linear infinite; }
        .bug-3 { animation: bugMove3 4s linear infinite; font-size: 14px; }
        .bug-4 { animation: bugMove4 7s linear infinite; font-size: 18px; }
        .bug-5 { animation: bugMove5 8s linear infinite; font-size: 12px; }
        
        .tear {
          position: absolute;
          font-size: 16px;
          z-index: 7;
          pointer-events: none;
          animation: tearFall 2s ease-in infinite;
        }
        .tear-1 { left: 30%; animation-delay: 0s; }
        .tear-2 { left: 60%; animation-delay: 1s; }
        
        .alert-flash {
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 40%, rgba(255,0,0,0.3) 50%, transparent 60%);
          background-size: 200% 200%;
          animation: alertFlash 1s ease-in-out infinite;
          pointer-events: none;
          z-index: 4;
        }
        
        .label-pulse {
          animation: labelPulse 1s ease-in-out infinite;
        }
        
        .cobweb {
          position: absolute;
          width: 80px;
          height: 80px;
          opacity: 0.7;
          z-index: 6;
          pointer-events: none;
        }
        .cobweb-tl { top: 0; left: 0; }
        .cobweb-tr { top: 0; right: 0; transform: scaleX(-1); }
        
        @keyframes dustFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.6; }
        }
        
        .dust {
          position: absolute;
          color: rgba(200,200,200,0.6);
          font-size: 8px;
          z-index: 6;
          pointer-events: none;
          animation: dustFloat 4s ease-in-out infinite;
        }
        .dust-1 { top: 40%; left: 20%; animation-delay: 0s; }
        .dust-2 { top: 60%; left: 50%; animation-delay: 1.5s; }
        .dust-3 { top: 30%; left: 70%; animation-delay: 3s; }
      `}</style>
    </>
  );
}
