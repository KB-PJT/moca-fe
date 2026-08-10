<script setup lang="ts">
import { Check, LoaderCircle, TriangleAlert, X } from '@lucide/vue'
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'
import { getMockCardConnection } from '@/domains/card/mocks/ownedCards'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'
import MocaButton from '@/shared/components/MocaButton.vue'

const router = useRouter()
const ownedCardsStore = useOwnedCardsStore()
const reconnectingIssuerId = ref<CardIssuerId | null>(null)
let reconnectTimer: ReturnType<typeof setTimeout> | undefined

function viewCardBenefits() {
  void router.push({ name: 'home' })
}

function returnToHome() {
  void router.replace({ name: 'home' })
}

// TODO(API): 카드사 재연결 API의 실제 성공/실패 응답으로 상태를 갱신하고 오류 안내를 추가한다.
function reconnectIssuer(issuerId: CardIssuerId) {
  if (reconnectingIssuerId.value) return

  reconnectingIssuerId.value = issuerId
  const reconnectDurationMs = getMockCardConnection(issuerId)?.reconnectDurationMs ?? 1400

  reconnectTimer = setTimeout(() => {
    ownedCardsStore.setIssuerConnectionStatus(issuerId, 'connected')
    reconnectingIssuerId.value = null
    reconnectTimer = undefined
  }, reconnectDurationMs)
}

onBeforeUnmount(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer)
})
</script>

<template>
  <CardPageLayout
    data-connect-complete-layout
    bg="screen"
    class="[&>main]:flex [&>main]:flex-col [&>main]:overflow-hidden"
    @back="returnToHome"
  >
    <section class="flex shrink-0 flex-col items-center text-center">
      <div
        class="flex size-16 items-center justify-center rounded-full bg-primary/8"
        aria-hidden="true"
      >
        <span class="flex size-12 items-center justify-center rounded-full bg-primary">
          <Check class="size-7 stroke-3 text-white" />
        </span>
      </div>

      <h1 class="mt-5 text-display text-charcoal">연결을 완료했어요</h1>
      <p class="mt-2 text-body leading-6 text-gray">
        이제 MOCA에서 카드 혜택과 실적을<br />
        확인해보세요
      </p>

      <div class="mt-4 flex items-center gap-2">
        <span class="rounded-full bg-primary/8 px-3 py-1.5 text-caption font-semibold text-primary">
          연결 성공 {{ ownedCardsStore.connectedIssuerCount }}개
        </span>
        <span
          v-if="ownedCardsStore.failedIssuerCount > 0"
          class="rounded-full bg-warning/10 px-3 py-1.5 text-caption font-semibold text-warning"
        >
          재연결 필요 {{ ownedCardsStore.failedIssuerCount }}개
        </span>
      </div>
    </section>

    <div
      v-if="ownedCardsStore.failedIssuerCount > 0"
      class="mt-5 flex shrink-0 items-start gap-3 rounded-md border border-warning/20 bg-warning/6 px-4 py-3 text-warning"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p class="text-caption leading-5">연결되지 않은 카드는 목록에서 다시 연결할 수 있어요.</p>
    </div>

    <div
      data-connection-complete-results-scroll
      class="scrollbar-line min-h-0 flex-1 overflow-y-auto rounded-md"
      :class="ownedCardsStore.failedIssuerCount > 0 ? 'mt-5' : 'mt-6'"
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
                : 'bg-warning/10 text-warning'
            "
            aria-hidden="true"
          >
            <Check v-if="issuer.status === 'connected'" class="size-3.5 stroke-3" />
            <LoaderCircle
              v-else-if="reconnectingIssuerId === issuer.id"
              class="size-3.5 animate-spin"
            />
            <X v-else class="size-3.5 stroke-3" />
          </span>
          <span class="flex-1 text-body font-medium text-charcoal">{{ issuer.name }}</span>
          <span v-if="issuer.status === 'connected'" class="text-caption font-medium text-primary">
            연결 완료
          </span>
          <button
            v-else
            type="button"
            class="flex h-8 min-w-16 items-center justify-center gap-1 rounded-sm border border-warning/30 px-2.5 text-caption font-semibold text-warning disabled:opacity-70"
            :disabled="reconnectingIssuerId !== null"
            @click="reconnectIssuer(issuer.id)"
          >
            <LoaderCircle v-if="reconnectingIssuerId === issuer.id" class="size-3 animate-spin" />
            {{ reconnectingIssuerId === issuer.id ? '연결 중' : '재연결' }}
          </button>
        </li>
      </ul>
    </div>

    <template #footer>
      <MocaButton block class="h-14 rounded-md text-subheading!" @click="viewCardBenefits">
        내 카드 혜택 확인하기
      </MocaButton>
    </template>
  </CardPageLayout>
</template>
