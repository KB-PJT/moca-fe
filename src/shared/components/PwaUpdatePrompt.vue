<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

const DISMISSED_UPDATE_KEY = 'pwa-update-dismissed'

const needsRefresh = ref(false)
let serviceWorkerRegistration: ServiceWorkerRegistration | undefined

function checkForUpdate() {
  void serviceWorkerRegistration?.update().catch(() => undefined)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    checkForUpdate()
  }
}

// 서비스 워커를 등록하고 새 버전이 대기 중이면 업데이트 안내를 표시한다.
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    needsRefresh.value = sessionStorage.getItem(DISMISSED_UPDATE_KEY) !== 'true'
  },
  onRegisteredSW(_swUrl, registration) {
    serviceWorkerRegistration = registration
    if (!registration?.waiting) {
      sessionStorage.removeItem(DISMISSED_UPDATE_KEY)
    }
    if (!registration) return

    checkForUpdate()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', checkForUpdate)
  },
})

function dismissUpdate() {
  needsRefresh.value = false
  sessionStorage.setItem(DISMISSED_UPDATE_KEY, 'true')
}

async function applyUpdate() {
  needsRefresh.value = false
  sessionStorage.removeItem(DISMISSED_UPDATE_KEY)
  await updateServiceWorker(true)
}

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('online', checkForUpdate)
})
</script>

<template>
  <ConfirmDialog
    :open="needsRefresh"
    title="새 버전이 준비됐어요"
    description="최신 기능을 사용하려면 앱을 업데이트해 주세요."
    confirm-label="업데이트"
    cancel-label="나중에"
    @update:open="needsRefresh = $event"
    @cancel="dismissUpdate"
    @confirm="applyUpdate"
  />
</template>
