<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { CARD_ISSUERS, isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import { formatCardNumber } from '@/shared/utils/format'

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId
  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})
const issuer = computed(() => (issuerId.value ? CARD_ISSUERS[issuerId.value] : null))
const connectedCards = computed(() => directCardConnectionStore.selectedCards)

function returnToHome() {
  void router.replace({ name: 'home' }).then(() => directCardConnectionStore.reset())
}

function viewCardBenefits() {
  void router.push({ name: 'home' }).then(() => directCardConnectionStore.reset())
}

onMounted(() => {
  if (
    !issuerId.value ||
    directCardConnectionStore.issuerId !== issuerId.value ||
    directCardConnectionStore.lookupStatus !== 'success' ||
    connectedCards.value.length === 0
  ) {
    directCardConnectionStore.reset()
    void router.replace({
      name: issuerId.value ? 'card-issuer-connect' : 'card-issuer-select',
      ...(issuerId.value ? { params: { issuerId: issuerId.value } } : {}),
    })
  }
})
</script>

<template>
  <CardPageLayout bg="screen" @back="returnToHome">
    <template v-if="issuer">
      <section class="flex flex-col items-center text-center">
        <div
          class="flex size-16 items-center justify-center rounded-full bg-primary/8"
          aria-hidden="true"
        >
          <span class="flex size-12 items-center justify-center rounded-full bg-primary">
            <Check class="size-7 stroke-3 text-white" />
          </span>
        </div>

        <h1 class="mt-5 text-display text-charcoal">연동을 완료했어요</h1>
        <p class="mt-2 text-body leading-6 text-gray">
          {{ issuer.name }} 카드 {{ connectedCards.length }}개를<br />MOCA에 추가했어요
        </p>
      </section>

      <ul class="mt-6 overflow-hidden rounded-md bg-card shadow-tile" aria-label="추가된 카드">
        <li
          v-for="card in connectedCards"
          :key="card.id"
          class="flex min-h-14 items-center gap-3 border-b border-divider px-4 py-3 last:border-b-0"
        >
          <CardImage
            :src="card.imageUrl"
            :alt="`${card.name} 카드 이미지`"
            small
            class="shrink-0"
          />
          <span
            class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
            aria-hidden="true"
          >
            <Check class="size-3.5 stroke-3" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-body font-medium text-charcoal">{{ card.name }}</p>
            <p class="mt-0.5 text-caption text-gray">{{ formatCardNumber(card.last4) }}</p>
          </div>
          <span class="text-caption font-medium text-primary">연결 완료</span>
        </li>
      </ul>
    </template>

    <template v-if="issuer" #footer>
      <MocaButton block class="h-14 text-subheading!" @click="viewCardBenefits">
        내 카드 혜택 확인하기
      </MocaButton>
    </template>
  </CardPageLayout>
</template>
