<script setup lang="ts">
import { Check, LoaderCircle, X } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { getMockCardConnection } from '@/domains/card/mocks/ownedCards'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'

const PROGRESS_TRANSITION_MS = 650
const PROGRESS_RADIUS = 48
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS

const router = useRouter()
const authStore = useAuthStore()
const ownedCardsStore = useOwnedCardsStore()
let stepTimer: ReturnType<typeof setTimeout> | undefined
let completionTimer: ReturnType<typeof setTimeout> | undefined

const issuerCount = computed(() => ownedCardsStore.ownedIssuers.length)
const nickname = computed(() => authStore.user?.nickname.trim() || '사용자')
const processedCount = computed(
  () =>
    ownedCardsStore.connectionResults.filter(
      (issuer) => issuer.status === 'connected' || issuer.status === 'failed',
    ).length,
)
const progress = computed(() => {
  if (issuerCount.value === 0) return 0
  return Math.round((processedCount.value / issuerCount.value) * 100)
})
const estimatedRemainingSeconds = computed(() => {
  const remainingMilliseconds = ownedCardsStore.connectionResults
    .filter((issuer) => issuer.status === 'waiting' || issuer.status === 'connecting')
    .reduce((total, issuer) => {
      const mockConnection = getMockCardConnection(issuer.id)
      return (
        total + (mockConnection?.connectionDurationMs ?? 1000) + (mockConnection?.delayAfterMs ?? 0)
      )
    }, 0)

  return Math.max(1, Math.ceil(remainingMilliseconds / 1000))
})

const progressCircleStyle = computed(() => ({
  strokeDasharray: PROGRESS_CIRCUMFERENCE,
  strokeDashoffset: PROGRESS_CIRCUMFERENCE * (1 - progress.value / 100),
  transition: `stroke-dashoffset ${PROGRESS_TRANSITION_MS}ms linear`,
}))

// TODO(API): 일괄연동 작업 생성 API와 상태 조회/폴링 응답으로 mock 타이머 및 결과 상태를 대체한다.
function connectIssuer(index: number) {
  const issuer = ownedCardsStore.ownedIssuers[index]
  if (!issuer) {
    completionTimer = setTimeout(() => {
      void router.push({ name: 'card-connect-complete' })
    }, PROGRESS_TRANSITION_MS + 400)
    return
  }

  ownedCardsStore.setIssuerConnectionStatus(issuer.id, 'connecting')
  const mockConnection = getMockCardConnection(issuer.id)

  stepTimer = setTimeout(() => {
    ownedCardsStore.setIssuerConnectionStatus(issuer.id, mockConnection?.status ?? 'connected')

    const delayBeforeNext = mockConnection?.delayAfterMs ?? 350
    stepTimer = setTimeout(() => connectIssuer(index + 1), delayBeforeNext)
  }, mockConnection?.connectionDurationMs ?? 1000)
}

function startConnecting() {
  if (issuerCount.value === 0) return

  ownedCardsStore.resetConnectionStatuses()
  connectIssuer(0)
}

function returnToBulkConnect() {
  void router.replace({ name: 'card-bulk-connect' })
}

onMounted(startConnecting)

onBeforeUnmount(() => {
  if (stepTimer) clearTimeout(stepTimer)
  if (completionTimer) clearTimeout(completionTimer)
})
</script>

<template>
  <CardPageLayout
    data-connect-progress-layout
    title="카드 연결"
    bg="screen"
    class="[&>main]:flex [&>main]:flex-col [&>main]:overflow-hidden"
    @back="returnToBulkConnect"
  >
    <section class="shrink-0 px-1 pt-1">
      <h1 class="text-display text-charcoal">
        {{ nickname }}님의 카드를<br />
        연결하고 있어요
      </h1>
      <p class="mt-2 text-body text-gray">잠시만 기다려 주세요</p>
    </section>

    <section
      v-if="issuerCount > 0"
      class="mt-8 flex shrink-0 flex-col items-center"
      aria-label="카드 연결 진행률"
    >
      <div
        class="relative flex size-28 items-center justify-center"
        role="progressbar"
        aria-label="전체 카드사 연결 진행률"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="progress"
      >
        <svg viewBox="0 0 112 112" class="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="56"
            cy="56"
            :r="PROGRESS_RADIUS"
            fill="none"
            stroke="var(--secondary)"
            stroke-width="9"
          />
          <circle
            cx="56"
            cy="56"
            :r="PROGRESS_RADIUS"
            fill="none"
            stroke="var(--primary)"
            stroke-width="9"
            stroke-linecap="round"
            :style="progressCircleStyle"
          />
        </svg>
        <span class="relative text-title text-primary">{{ progress }}%</span>
      </div>
      <p class="mt-3 text-caption text-gray">
        {{ processedCount }}개 / {{ issuerCount }}개 카드사 확인
        <template v-if="processedCount < issuerCount">
          · 약 {{ estimatedRemainingSeconds }}초 남음
        </template>
        <template v-else>· 결과 정리 중</template>
      </p>
    </section>

    <div
      v-if="issuerCount > 0"
      data-connection-results-scroll
      class="scrollbar-line mt-7 min-h-0 flex-1 overflow-y-auto rounded-md"
    >
      <ul class="overflow-hidden rounded-md bg-card shadow-tile">
        <li
          v-for="issuer in ownedCardsStore.connectionResults"
          :key="issuer.id"
          class="flex h-13 items-center gap-3 border-b border-divider px-4 last:border-b-0"
        >
          <span
            class="flex size-5 shrink-0 items-center justify-center rounded-full"
            :class="
              issuer.status === 'connected'
                ? 'bg-primary/12 text-primary'
                : issuer.status === 'failed'
                  ? 'bg-error/10 text-error'
                  : 'bg-screen text-gray'
            "
            aria-hidden="true"
          >
            <Check v-if="issuer.status === 'connected'" class="size-3.5 stroke-3" />
            <LoaderCircle
              v-else-if="issuer.status === 'connecting'"
              class="size-3.5 animate-spin text-primary"
            />
            <X v-else-if="issuer.status === 'failed'" class="size-3.5 stroke-3" />
            <span v-else class="size-1.5 rounded-full bg-disabled" />
          </span>

          <span class="flex-1 text-body font-medium text-charcoal">{{ issuer.name }}</span>
          <span
            class="text-caption font-medium"
            :class="
              issuer.status === 'connected' || issuer.status === 'connecting'
                ? 'text-primary'
                : issuer.status === 'failed'
                  ? 'text-error'
                  : 'text-gray'
            "
          >
            {{
              issuer.status === 'connected'
                ? '연결 완료'
                : issuer.status === 'connecting'
                  ? '연결 중'
                  : issuer.status === 'failed'
                    ? '연결 실패'
                    : '대기 중'
            }}
          </span>
        </li>
      </ul>
    </div>

    <section v-else class="mt-20 rounded-md bg-card px-5 py-10 text-center shadow-tile">
      <p class="text-subheading text-charcoal">연결할 카드가 없어요</p>
      <p class="mt-2 text-body text-gray">보유카드 정보를 확인한 뒤 다시 시도해 주세요</p>
    </section>
  </CardPageLayout>
</template>
