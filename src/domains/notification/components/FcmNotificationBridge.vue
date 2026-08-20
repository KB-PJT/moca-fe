<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { fetchMyPageSummary } from '@/domains/mypage/api/mypage'
import { fetchNotificationSettings } from '@/domains/notification/api/notificationSettings'
import { updateRecentLocation } from '@/domains/notification/api/fcm'
import {
  listenForForegroundMessages,
  synchronizeFcmToken,
} from '@/domains/notification/services/firebaseMessaging'
import type { FcmNotificationData, FcmServiceWorkerMessage } from '@/domains/notification/types/fcm'
import { resolveNotificationRoute } from '@/domains/notification/utils/notificationNavigation'
import { requestCurrentPosition } from '@/domains/map/composables/currentLocation'

const LOCATION_SYNC_INTERVAL_MS = 5 * 60 * 1000

const authStore = useAuthStore()
const router = useRouter()
let stopForegroundMessages: (() => void) | null = null
let lastLocationSyncedAt = 0

async function displayForegroundNotification(
  title: string,
  body: string | undefined,
  data: FcmNotificationData,
) {
  if (Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    body,
    icon: '/icons/moca-app-icon-192.png',
    badge: '/icons/moca-app-icon-192.png',
    data,
  })
}

async function synchronizeRecentLocation(expectedAccessToken: string, force = false) {
  if (authStore.accessToken !== expectedAccessToken || document.visibilityState !== 'visible')
    return
  if (!force && Date.now() - lastLocationSyncedAt < LOCATION_SYNC_INTERVAL_MS) return

  try {
    const [locationSettings, notificationSettings] = await Promise.all([
      fetchMyPageSummary(),
      fetchNotificationSettings(),
    ])
    if (authStore.accessToken !== expectedAccessToken) return
    if (
      !locationSettings.locationRecommendationEnabled ||
      !notificationSettings.nearbyBenefitEnabled
    ) {
      return
    }

    const coordinates = await requestCurrentPosition()
    if (!coordinates || authStore.accessToken !== expectedAccessToken) return

    await updateRecentLocation(coordinates.latitude, coordinates.longitude)
    if (authStore.accessToken !== expectedAccessToken) return
    lastLocationSyncedAt = Date.now()
  } catch {
    // 토큰/위치 동기화 실패가 앱 사용을 막지 않도록 다음 활성화 시 재시도한다.
  }
}

function handleServiceWorkerMessage(event: MessageEvent<FcmServiceWorkerMessage>) {
  if (event.data?.type !== 'FCM_NOTIFICATION_CLICK') return
  void router.push(resolveNotificationRoute(event.data.data))
}

function handleVisibilityChange() {
  const accessToken = authStore.accessToken
  if (document.visibilityState === 'visible' && accessToken) {
    void synchronizeRecentLocation(accessToken)
  }
}

onMounted(async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  stopForegroundMessages = await listenForForegroundMessages((payload) => {
    const data = payload.data ?? {}
    void displayForegroundNotification(
      payload.notification?.title ?? data.title ?? 'MOCA',
      payload.notification?.body ?? data.body,
      data,
    )
  })
})

watch(
  () => authStore.accessToken,
  (accessToken) => {
    if (!accessToken) {
      lastLocationSyncedAt = 0
      return
    }

    void synchronizeFcmToken(accessToken).catch(() => undefined)
    void synchronizeRecentLocation(accessToken, true)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopForegroundMessages?.()
  navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <span v-if="false" />
</template>
