<script setup lang="ts">
import { CreditCard, ShieldCheck } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { CARD_ISSUERS, isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'
import MocaButton from '@/shared/components/MocaButton.vue'
import { Checkbox } from '@/shared/ui/checkbox'
import { formatCardNumber } from '@/shared/utils/format'

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()
const ownedCardsStore = useOwnedCardsStore()

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId
  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})
const issuer = computed(() => (issuerId.value ? CARD_ISSUERS[issuerId.value] : null))
const selectedCount = computed(() => directCardConnectionStore.selectedCards.length)
const allSelectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedCount.value === 0) return false
  if (selectedCount.value === directCardConnectionStore.discoveredCards.length) return true
  return 'indeterminate'
})

function returnToIssuerForm() {
  directCardConnectionStore.reset()

  if (issuerId.value) {
    void router.replace({ name: 'card-issuer-connect', params: { issuerId: issuerId.value } })
  } else {
    void router.replace({ name: 'card-issuer-select' })
  }
}

function addSelectedCards() {
  if (!issuerId.value || selectedCount.value === 0) return

  ownedCardsStore.addOwnedCards(
    directCardConnectionStore.selectedCards.map(
      ({ id, issuer: cardIssuer, name, last4, imageUrl }) => ({
        id,
        issuer: cardIssuer,
        name,
        last4,
        imageUrl,
      }),
    ),
  )
  void router.push({
    name: 'card-issuer-connect-complete',
    params: { issuerId: issuerId.value },
  })
}

onMounted(() => {
  if (
    !issuerId.value ||
    directCardConnectionStore.issuerId !== issuerId.value ||
    directCardConnectionStore.lookupStatus !== 'success'
  ) {
    returnToIssuerForm()
  }
})
</script>

<template>
  <CardPageLayout title="카드 등록" bg="screen" @back="returnToIssuerForm">
    <template v-if="issuer">
      <section class="-mx-5 -mt-6 border-b border-divider bg-card px-5 py-4">
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <CreditCard class="size-3" />
          </span>
          <div>
            <h1 class="text-body font-semibold text-primary">보유 카드를 불러왔어요</h1>
            <p class="mt-1 text-caption text-gray">
              {{ issuer.name }}에서 {{ directCardConnectionStore.discoveredCards.length }}개 카드를
              찾았어요
            </p>
          </div>
        </div>
      </section>

      <section class="pt-4">
        <p class="text-caption text-gray">등록할 카드를 선택해 주세요</p>

        <div
          v-if="directCardConnectionStore.discoveredCards.length > 0"
          class="mt-2 overflow-hidden rounded-md bg-card shadow-tile"
        >
          <label class="flex h-12 cursor-pointer items-center gap-3 border-b border-divider px-4">
            <Checkbox
              :model-value="allSelectionState"
              aria-label="전체 카드 선택"
              @update:model-value="directCardConnectionStore.setAllSelected($event === true)"
            />
            <span class="flex-1 text-body font-semibold text-charcoal">전체 선택</span>
            <span class="text-caption text-gray">
              {{ directCardConnectionStore.discoveredCards.length }}개 카드
            </span>
          </label>

          <ul aria-label="조회된 보유카드">
            <li
              v-for="card in directCardConnectionStore.discoveredCards"
              :key="card.id"
              class="border-b border-divider last:border-b-0"
            >
              <label class="flex min-h-18 cursor-pointer items-center gap-3 px-4 py-3">
                <div
                  class="flex h-10 w-16 shrink-0 items-end rounded-sm p-2 shadow-sm"
                  :style="{
                    background: directCardConnectionStore.includeCardImages
                      ? `linear-gradient(145deg, ${card.cardColor ?? '#315b86'}, #132b47)`
                      : '#e8e3de',
                  }"
                  aria-hidden="true"
                >
                  <span class="text-[8px] font-semibold text-white/90">
                    •••• {{ card.last4 }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-semibold text-charcoal">{{ card.name }}</p>
                  <p class="mt-0.5 text-caption text-gray">{{ formatCardNumber(card.last4) }}</p>
                </div>
                <Checkbox
                  :model-value="directCardConnectionStore.selectedCardIds.includes(card.id)"
                  :aria-label="`${card.name} 선택`"
                  class="size-5 rounded-full"
                  @update:model-value="
                    directCardConnectionStore.setCardSelected(card.id, $event === true)
                  "
                />
              </label>
            </li>
          </ul>
        </div>

        <div v-else class="mt-8 rounded-md bg-card px-5 py-10 text-center shadow-tile">
          <CreditCard class="mx-auto size-10 text-disabled" aria-hidden="true" />
          <h2 class="mt-4 text-subheading text-charcoal">추가할 카드가 없어요</h2>
          <p class="mt-2 text-body text-gray">해당 기관에서 새로 확인된 카드가 없습니다</p>
        </div>
      </section>
    </template>

    <template v-if="issuer" #footer>
      <div class="flex flex-col items-center">
        <MocaButton
          block
          :disabled="selectedCount === 0"
          class="h-14 text-subheading!"
          @click="addSelectedCards"
        >
          선택한 카드 {{ selectedCount }}개 불러오기
        </MocaButton>
        <p class="mt-2 flex items-center gap-1 text-micro font-normal text-gray">
          <ShieldCheck class="size-3" aria-hidden="true" />
          카드 정보는 암호화되어 안전하게 처리돼요
        </p>
      </div>
    </template>
  </CardPageLayout>
</template>
