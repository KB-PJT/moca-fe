<script setup lang="ts">
import { CircleAlert, LoaderCircle } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BulkCardConnectIllustration from '@/domains/card/components/BulkCardConnectIllustration.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { CARD_ISSUERS, isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import MocaButton from '@/shared/components/MocaButton.vue'

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId
  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})
const issuer = computed(() => (issuerId.value ? CARD_ISSUERS[issuerId.value] : null))

function returnToIssuerForm() {
  directCardConnectionStore.reset()

  if (issuerId.value) {
    void router.replace({ name: 'card-issuer-connect', params: { issuerId: issuerId.value } })
  } else {
    void router.replace({ name: 'card-issuer-select' })
  }
}

function syncLookupRoute() {
  if (!issuerId.value || directCardConnectionStore.issuerId !== issuerId.value) {
    returnToIssuerForm()
    return
  }

  if (directCardConnectionStore.lookupStatus === 'success') {
    void router.replace({
      name: 'card-issuer-card-select',
      params: { issuerId: issuerId.value },
    })
  } else if (directCardConnectionStore.lookupStatus === 'idle') {
    returnToIssuerForm()
  }
}

watch(() => directCardConnectionStore.lookupStatus, syncLookupRoute, { immediate: true })
</script>

<template>
  <CardPageLayout title="카드 등록" bg="screen" @back="returnToIssuerForm">
    <section v-if="issuer" class="flex min-h-full flex-col text-center">
      <div class="flex flex-1 flex-col items-center justify-center pb-12">
        <BulkCardConnectIllustration
          v-if="directCardConnectionStore.lookupStatus !== 'failed'"
          scanning
          class="w-52"
        />
        <div
          v-else
          class="flex size-20 items-center justify-center rounded-full bg-error/10 text-error"
        >
          <CircleAlert class="size-10" aria-hidden="true" />
        </div>

        <template v-if="directCardConnectionStore.lookupStatus === 'failed'">
          <h1 class="mt-6 text-title text-charcoal">카드를 조회하지 못했어요</h1>
          <p class="mt-2 text-body leading-6 text-gray">
            {{
              directCardConnectionStore.lookupError?.message ??
              `입력한 ${issuer.name} 정보를 확인한 뒤 다시 시도해 주세요`
            }}
          </p>
          <MocaButton class="mt-6 h-12 px-8" @click="returnToIssuerForm">
            돌아가서 다시 시도하기
          </MocaButton>
        </template>
        <template v-else>
          <h1 class="mt-5 text-title text-charcoal">{{ issuer.name }} 연동 중</h1>
          <p class="mt-2 text-body text-gray">해당 기관의 보유카드를 조회하고 있어요</p>
          <p class="mt-5 flex items-center gap-1.5 text-caption text-brown" aria-live="polite">
            <LoaderCircle class="size-3.5 animate-spin" aria-hidden="true" />
            잠시만 기다려 주세요
          </p>
        </template>
      </div>
    </section>
  </CardPageLayout>
</template>
