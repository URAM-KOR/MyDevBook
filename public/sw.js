// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
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

  const options = {
    body: data.body || data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'mydevbook-' + Date.now(), // 고유 태그로 중복 방지
    renotify: true, // 같은 태그여도 다시 알림
    requireInteraction: false, // 자동으로 사라지게
    silent: false, // 소리 활성화
    data: {
      url: data.url || '/',
      portfolioId: data.portfolioId,
    },
    actions: [
      { action: 'view', title: '확인하기' },
      { action: 'close', title: '닫기' },
    ],
  };

  // 포커스 상태와 관계없이 항상 알림 표시
  event.waitUntil(
    self.registration.showNotification(data.title, options)
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

