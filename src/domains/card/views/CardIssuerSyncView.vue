<script setup lang="ts">
import { CircleAlert, LoaderCircle } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { syncMyCards } from '@/domains/card/api/cardManagement'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import MocaButton from '@/shared/components/MocaButton.vue'

type SyncViewState = 'idle' | 'syncing' | 'failed'

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()
const syncState = ref<SyncViewState>('idle')

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId
  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})
const hasRegistrationContext = computed(
  () =>
    Boolean(issuerId.value) &&
    directCardConnectionStore.issuerId === issuerId.value &&
    directCardConnectionStore.activationCompleted &&
    directCardConnectionStore.selectedCards.length > 0,
)

async function finishSync() {
  if (hasRegistrationContext.value && issuerId.value) {
    await router.replace({
      name: 'card-issuer-connect-complete',
      params: { issuerId: issuerId.value },
    })
    return
  }

  await router.replace({ name: 'home' })
  directCardConnectionStore.reset()
}

async function runSync() {
  if (syncState.value === 'syncing') return

  syncState.value = 'syncing'
  directCardConnectionStore.setApprovalSyncStatus('syncing')

  try {
    await syncMyCards()
  } catch {
    syncState.value = 'failed'
    directCardConnectionStore.setApprovalSyncStatus('failed')
    return
  }

  directCardConnectionStore.setApprovalSyncStatus('success')
  await finishSync()
}

async function skipSync() {
  if (syncState.value === 'syncing') return

  directCardConnectionStore.setApprovalSyncStatus('skipped')
  await finishSync()
}

onBeforeRouteLeave((to) => {
  if (to.name === 'card-issuer-connect-complete' || to.name === 'home' || to.name === 'login') {
    return true
  }

  return false
})

onMounted(() => void runSync())
</script>

<template>
  <CardPageLayout title="카드 등록" bg="screen" :show-back="false">
    <section class="flex min-h-full flex-col items-center justify-center pb-12 text-center">
      <template v-if="syncState !== 'failed'">
        <div
          class="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <LoaderCircle class="size-10 animate-spin" />
        </div>
        <h1 class="mt-6 text-title text-charcoal">승인내역을 불러오고 있어요</h1>
        <p class="mt-2 text-body leading-6 text-gray">
          카드 혜택과 실적을 정리하고 있어요<br />잠시만 기다려 주세요
        </p>
        <p class="sr-only" aria-live="polite">승인내역 동기화 중</p>
      </template>

      <template v-else>
        <div
          class="flex size-20 items-center justify-center rounded-full bg-error/10 text-error"
          aria-hidden="true"
        >
          <CircleAlert class="size-10" />
        </div>
        <h1 class="mt-6 text-subheading font-semibold text-charcoal">
          승인내역을 불러오지 못했어요
        </h1>
        <p class="mt-2 text-body leading-6 text-gray">
          카드 등록은 완료됐어요.<br />다시 시도하거나 나중에 불러올 수 있어요.
        </p>
        <div class="mt-7 flex w-full max-w-72 flex-col gap-2">
          <MocaButton block class="h-12" @click="runSync">다시 시도</MocaButton>
          <MocaButton block variant="ghost" class="h-12" @click="skipSync">
            나중에 하기
          </MocaButton>
        </div>
        <p class="mt-3 text-micro text-gray">승인내역은 다음 자동 동기화 때 반영돼요</p>
      </template>
    </section>
  </CardPageLayout>
</template>
