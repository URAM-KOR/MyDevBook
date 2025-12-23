// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  // 즉시 활성화하여 새 버전 사용
  self.skipWaiting();
  // 설치 즉시 활성화
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  // 모든 클라이언트에 즉시 제어권 부여
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 모든 클라이언트에게 새 버전 사용 알림
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      })
    ])
  );
});

// Push 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = { title: '알림', body: '새로운 알림이 있습니다.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // 포트폴리오별 고유 태그 (같은 포트폴리오 알림은 업데이트)
  const tag = data.portfolioId ? `portfolio-${data.portfolioId}` : `mydevbook-${Date.now()}`;
  
  // icon: 포트폴리오 카드 이미지 (있으면 사용, 없으면 랜딩 이미지)
  // badge: 무조건 favicon.ico 사용
  const notificationIcon = data.image || '/landing-image.png';
  
  const options = {
    body: data.body || data.message,
    icon: notificationIcon, // 포트폴리오 카드 이미지 또는 랜딩 이미지
    badge: '/favicon.ico', // 무조건 favicon.ico 사용
    image: undefined, // 큰 이미지 제거 (작은 아이콘만 사용)
    vibrate: [300, 200, 300, 200, 300], // 더 강한 진동 패턴
    tag: tag,
    renotify: true, // 같은 태그여도 다시 알림
    requireInteraction: true, // 사용자가 직접 닫을 때까지 표시 (더 적극적)
    silent: false, // 소리 활성화
    sound: '/notification.mp3', // 소리 파일 (있는 경우)
    priority: 'high', // 높은 우선순위
    urgency: 'high', // 긴급도 높음
    timestamp: Date.now(), // 타임스탬프
    data: {
      url: data.url || '/portfolios',
      portfolioId: data.portfolioId,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'view', title: '확인하기', icon: '/icon-192.png' },
      { action: 'close', title: '닫기' },
    ],
  };

  // 포커스 상태와 관계없이 항상 알림 표시 (백그라운드에서도 적극적으로)
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('Notification shown:', data.title);
        // 열린 클라이언트에게 메시지 전송 (있는 경우)
        return clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clientList) => {
        // 열린 탭이 있으면 메시지 전송하여 프론트엔드에서도 처리 가능하게
        clientList.forEach((client) => {
          try {
            client.postMessage({
              type: 'PUSH_NOTIFICATION',
              data: data,
            });
          } catch (e) {
            console.log('Could not send message to client:', e);
          }
        });
      })
      .catch((error) => {
        console.error('Error showing notification:', error);
      })
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/portfolios';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // 없으면 새 탭
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

