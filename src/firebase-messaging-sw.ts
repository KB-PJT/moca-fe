/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { resolveNotificationPath } from '@/domains/notification/utils/notificationNavigation'
import type { FcmNotificationData } from '@/domains/notification/types/fcm'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<never>
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 개발 서버에는 /index.html precache 항목이 없고 Vite가 직접 SPA fallback을 처리한다.
// 실제 빌드에서만 Workbox의 오프라인 navigation fallback을 등록한다.
if (!import.meta.env.DEV) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [/^\/api(?:\/|$)/],
    }),
  )
}

// Firebase Messaging은 getMessaging() 시 자체 notificationclick 핸들러를 등록한다.
// MOCA data payload가 있는 알림은 그보다 먼저 가로채 앱 라우팅을 우선 적용한다.
self.addEventListener('notificationclick', (event) => {
  const notificationData = event.notification.data as unknown
  let data: FcmNotificationData = {}

  if (
    typeof notificationData === 'object' &&
    notificationData !== null &&
    'FCM_MSG' in notificationData
  ) {
    data = (notificationData as { FCM_MSG?: { data?: FcmNotificationData } }).FCM_MSG?.data ?? {}
  } else if (typeof notificationData === 'object' && notificationData !== null) {
    data = notificationData as FcmNotificationData
  }

  const hasMocaTarget =
    (data.type === 'PERFORMANCE_DEADLINE' && Boolean(data.userCardId)) ||
    data.type === 'TIME_BASED_BENEFIT' ||
    data.target === 'MAP'
  if (!hasMocaTarget) return

  event.stopImmediatePropagation()
  event.notification.close()
  const targetPath = resolveNotificationPath(data)
  const targetUrl = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const client = clients[0]
      if (client) {
        await client.focus()
        client.postMessage({ type: 'FCM_NOTIFICATION_CLICK', data })
        return
      }

      await self.clients.openWindow(targetUrl)
    }),
  )
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  const messaging = getMessaging(initializeApp(firebaseConfig))

  onBackgroundMessage(messaging, (payload) => {
    // notification payload는 브라우저가 자동 표시하므로 data-only 메시지만 직접 표시한다.
    if (payload.notification) return

    const data = payload.data ?? {}
    void self.registration.showNotification(data.title ?? 'MOCA', {
      body: data.body,
      icon: '/icons/moca-app-icon-192.png',
      badge: '/icons/moca-app-icon-192.png',
      data,
    })
  })
}
