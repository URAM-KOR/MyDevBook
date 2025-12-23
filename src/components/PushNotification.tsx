'use client';

import { useState, useEffect, useRef } from 'react';
import { Portfolio } from '@/types';
import { WeatherStatus } from './WeatherOverlay';
import { weatherConfig } from './WeatherOverlay';
import { Bell, BellOff } from 'lucide-react';

interface PushNotificationProps {
  portfolios?: Portfolio[];
}

export default function PushNotification({ portfolios = [] }: PushNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();

    // 외부 클릭 시 툴팁 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(!!subscription);
      }
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      // 알림 권한 요청
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        alert('알림 권한이 필요합니다.');
        setLoading(false);
        return;
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Push 구독
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      });

      // 서버에 구독 정보 저장
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
      });

      if (response.ok) {
        setSubscribed(true);
        alert('알림이 활성화되었습니다!');
      }
    } catch (error) {
      console.error('Push subscription error:', error);
      alert('알림 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
      } else {
        alert(result.error || '알림 전송 실패');
      }
    } catch (error) {
      console.error('Test notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 툴팁 토글 함수
  const toggleTooltip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  // 클라이언트에서만 렌더링
  if (!mounted) {
    return null;
  }

  // 통계 계산
  const stats = portfolios.reduce((acc, portfolio) => {
    const status = (portfolio.weather_status || 'healthy') as WeatherStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<WeatherStatus, number>);

  return (
    <div ref={containerRef} className="px-4 pt-3.5 pb-1.5 border-b border-white/10 -mt-4 mb-4">
      <div className="flex items-center justify-between text-xs text-gray-400">

        {/* 왼쪽: 포트폴리오 상태 통계 */}
        <div className="flex items-center gap-3">
          {Object.entries(weatherConfig).map(([key, config]) => {
            const count = stats[key as WeatherStatus] || 0;
            if (count === 0) return null;
            const tooltipId = `stat-${key}`;
            const isActive = activeTooltip === tooltipId;

            return (
              <div
                key={key}
                className="relative flex items-center gap-1.5 px-2 py-1 rounded-full border cursor-pointer group transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: config.bgTint || 'rgba(255,255,255,0.05)',
                  borderColor: config.borderColor || 'rgba(255,255,255,0.1)',
                }}
                onClick={(e) => toggleTooltip(tooltipId, e)}
              >
                <span className="text-sm">{config.emoji}</span>
                <span className="text-xs font-bold" style={{ color: config.borderColor }}>{count}</span>

                {/* Status Tooltip */}
                <div
                  className={`absolute left-0 top-full mt-2 w-40 p-2 bg-gray-900 border border-gray-700 text-xs text-gray-200 rounded-lg shadow-xl z-50 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}
                >
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 border-t border-l border-gray-700 transform rotate-45"></div>
                  {config.label}
                </div>
              </div>
            );
          })}
          {portfolios.length === 0 && (
            <span className="text-gray-500 italic">No quests active</span>
          )}
        </div>

        {/* 오른쪽: 알림 제어 */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <div className="flex items-center gap-3">

            {/* 상태 표시 및 툴팁 영역 (Hover/Click Group) */}
            <div
              className="relative flex items-center gap-2 cursor-pointer group"
              onClick={(e) => toggleTooltip('notification', e)}
            >
              {subscribed ? (
                <>
                  <Bell size={14} className="text-green-400 animate-pulse" />
                  <span className="hidden sm:inline text-green-400 font-bold">ON</span>
                </>
              ) : (
                <>
                  <BellOff size={14} className="text-gray-500" />
                  <span className="hidden sm:inline text-gray-500">OFF</span>
                </>
              )}

              {/* Tooltip */}
              <div
                className={`absolute right-0 top-full mt-2 w-48 p-2 bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg shadow-xl z-50 text-center transition-opacity ${activeTooltip === 'notification' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}
              >
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 border-t border-l border-gray-700 transform rotate-45"></div>
                {subscribed
                  ? "현재 알림이 활성화된 상태입니다."
                  : "현재 알림이 비활성화된 상태입니다."}
              </div>
            </div>

            {!subscribed && (
              <button
                onClick={subscribe}
                disabled={loading}
                className="px-2 py-0.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 rounded transition-colors disabled:opacity-50"
              >
                {loading ? '...' : '켜기'}
              </button>
            )}

            {subscribed && (
              <button
                onClick={testNotification}
                disabled={loading}
                className="px-2 py-0.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Test'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Base64 to Uint8Array 변환
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
