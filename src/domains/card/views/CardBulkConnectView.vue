<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import BulkCardConnectIllustration from '@/domains/card/components/BulkCardConnectIllustration.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import MocaButton from '@/shared/components/MocaButton.vue'

const SCAN_DURATION_MS = 2600

const router = useRouter()
const authStore = useAuthStore()
const isScanning = ref(true)
let scanTimer: ReturnType<typeof setTimeout> | undefined
const nickname = computed(() => authStore.user?.nickname.trim() || '사용자')

// TODO(API): 보유카드 사전 조회 API의 로딩/완료 상태로 교체하고 응답은 ownedCards 스토어에 저장한다.
function startScan() {
  if (scanTimer) clearTimeout(scanTimer)

  isScanning.value = true
  scanTimer = setTimeout(() => {
    isScanning.value = false
    scanTimer = undefined
  }, SCAN_DURATION_MS)
}

function startConnecting() {
  void router.push({ name: 'card-connect-progress' })
}

function returnToCardConnect() {
  void router.replace({ name: 'card-connect' })
}

onMounted(startScan)

onBeforeUnmount(() => {
  if (scanTimer) clearTimeout(scanTimer)
})
</script>

<template>
  <CardPageLayout
    bg="screen"
    class="[&>div:last-child]:border-t-0 [&>div:last-child]:bg-transparent!"
    @back="returnToCardConnect"
  >
    <div class="flex min-h-full flex-col">
      <section class="px-1 pt-1">
        <h1 class="text-display text-charcoal">
          {{ nickname }}님의 카드를<br />
          찾아볼게요
        </h1>
        <p class="mt-2 text-body text-gray">최대 1분 정도 걸릴 수 있어요</p>
      </section>

      <section class="flex flex-1 flex-col items-center justify-center pb-7 text-center">
        <BulkCardConnectIllustration :scanning="isScanning" class="w-52" />
        <p class="mt-5 text-body font-medium text-charcoal" aria-live="polite">
          {{ isScanning ? '보유 카드를 확인하고 있어요' : '카드를 불러올 준비가 됐어요' }}
        </p>
        <p class="mt-1 text-caption text-gray">
          {{ isScanning ? '잠시만 기다려 주세요' : '아래 버튼을 눌러 연결을 시작해 주세요' }}
        </p>
      </section>
    </div>

    <template #footer>
      <MocaButton
        block
        :loading="isScanning"
        class="h-14 rounded-md text-subheading!"
        @click="startConnecting"
      >
        {{ isScanning ? '카드를 확인하는 중' : '연결 시작하기' }}
      </MocaButton>
    </template>
  </CardPageLayout>
</template>
