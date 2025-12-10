'use client';

import { useState, useEffect } from 'react';
import { colors, spacing, button } from '@/styles/design-tokens';

export default function PushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
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

  // 클라이언트에서만 렌더링
  if (!mounted) {
    return null;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return (
    <div style={{
      padding: spacing.md,
      backgroundColor: colors.gray[50],
      borderRadius: '12px',
      marginBottom: spacing.lg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        <span style={{ fontSize: '14px', color: colors.gray[700] }}>
          {subscribed ? '알림 활성화됨' : '알림을 받으시겠습니까?'}
        </span>
        
        {!subscribed && (
          <button
            onClick={subscribe}
            disabled={loading}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: colors.blue[500],
              color: 'white',
              borderRadius: button.borderRadius,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? '처리중...' : '알림 허용'}
          </button>
        )}
        
        {subscribed && (
          <button
            onClick={testNotification}
            disabled={loading}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: colors.gray[200],
              color: colors.gray[700],
              borderRadius: button.borderRadius,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? '전송중...' : '테스트 알림'}
          </button>
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

