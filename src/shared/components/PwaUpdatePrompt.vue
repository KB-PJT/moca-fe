<script setup lang="ts">
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

const needsRefresh = ref(false)

// 서비스 워커를 등록하고 새 버전이 대기 중이면 업데이트 안내를 표시한다.
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    needsRefresh.value = true
  },
})

function dismissUpdate() {
  needsRefresh.value = false
}

async function applyUpdate() {
  needsRefresh.value = false
  await updateServiceWorker(true)
}
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
