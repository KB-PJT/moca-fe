<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { BadgePercent, Check, Lock, LoaderCircle, RefreshCw } from '@lucide/vue'
import {
  fetchMerchantCardRecommendations,
  type RankedCardBenefit,
} from '@/domains/map/api/merchants'
import { formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import { formatAmountWithUnit } from '@/shared/utils/format'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'
import { brandMark } from '@/domains/map/composables/markerIcon'
import PageLayout from '@/shared/components/PageLayout.vue'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import CardPinDialog from '@/domains/map/components/CardPinDialog.vue'
import MockQrCode from '@/domains/map/components/MockQrCode.vue'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'

const route = useRoute()
const router = useRouter()

// placeId는 `${merchantId}:${latitude}:${longitude}` 형태의 합성 키라, 실제 API 호출에 쓰는
// merchantId는 첫 구간만 떼어내면 된다 (toMerchant() 참고).
const merchantId = computed(() => String(route.params.placeId).split(':')[0] ?? '')
const merchantName = computed(() => String(route.query.name ?? ''))
const merchantCategory = computed(() => String(route.query.category ?? ''))
const brandName = computed(() => (route.query.brand ? String(route.query.brand) : undefined))

// 가맹점 상세 헤더랑 같은 브랜드 로고 데이터를 재사용해서, 여기서도 "어디서 결제하는지"가
// 한눈에 보이게 한다.
const brand = computed(() => (brandName.value ? brandMark[brandName.value] : undefined))

const {
  data: recommendation,
  isPending,
  isError,
} = useQuery({
  queryKey: ['merchants', merchantId, 'card-recommendations'],
  queryFn: () => fetchMerchantCardRecommendations(merchantId.value),
})

const rankedCards = computed(() => recommendation.value?.rankedCards ?? [])

// MOCA가 추천한 카드로 기본 선택해두되, 사용자가 카드 변경 시트에서 직접 다른 카드를 고르면
// 그 선택을 유지한다. 가맹점이 바뀌어 추천 결과 자체가 새로 오면 다시 추천 카드로 리셋한다.
const selectedUserCardId = ref<string | null>(null)

watch(
  () => recommendation.value?.recommendedCard?.userCardId,
  (recommendedId) => {
    if (recommendedId) selectedUserCardId.value = recommendedId
  },
)

const selectedCard = computed<RankedCardBenefit | null>(
  () =>
    rankedCards.value.find((card) => card.userCardId === selectedUserCardId.value) ??
    recommendation.value?.recommendedCard ??
    null,
)

const isCardPickerOpen = ref(false)

function selectCard(card: RankedCardBenefit) {
  selectedUserCardId.value = card.userCardId
  isCardPickerOpen.value = false
}

const isPinDialogOpen = ref(false)

// review: 카드 확인 + 결제하기 버튼. qr: 비밀번호 통과 후 QR 노출(카드는 자리를 살짝 양보).
// calculating: QR을 눌러 "스캔됐다"고 가정한 뒤 실제 혜택 계산 중. complete: 결과 화면.
const stage = ref<'review' | 'qr' | 'calculating' | 'complete'>('review')

function confirmPayment() {
  isPinDialogOpen.value = true
}

function handlePinConfirmed() {
  stage.value = 'qr'
  startQrCountdown()
}

// 실제 QR결제처럼 유효시간이 있다는 느낌을 주기 위한 카운트다운. 만료되면 QR을 흐리게
// 표시하고 눌러서 다시 발급받게 한다.
const QR_EXPIRY_SECONDS = 120
const qrSecondsLeft = ref(QR_EXPIRY_SECONDS)
let qrCountdownTimer: ReturnType<typeof setInterval> | undefined

const isQrExpired = computed(() => qrSecondsLeft.value <= 0)

const qrTimeLabel = computed(() => {
  const minutes = Math.floor(qrSecondsLeft.value / 60)
  const seconds = qrSecondsLeft.value % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

function startQrCountdown() {
  qrSecondsLeft.value = QR_EXPIRY_SECONDS
  stopQrCountdown()
  qrCountdownTimer = setInterval(() => {
    qrSecondsLeft.value -= 1
    if (qrSecondsLeft.value <= 0) stopQrCountdown()
  }, 1000)
}

function stopQrCountdown() {
  if (!qrCountdownTimer) return
  clearInterval(qrCountdownTimer)
  qrCountdownTimer = undefined
}

onUnmounted(stopQrCountdown)

// 실제 스캐너가 없어서, 목업에서는 QR을 직접 눌러 "가맹점에서 스캔했다"를 가정한다.
function generateMockPaymentAmount(): number {
  const amount = Math.floor(Math.random() * (25000 - 3000 + 1)) + 3000
  return Math.round(amount / 100) * 100
}

const mockPaymentAmount = ref(0)
const completedBenefitAmount = ref(0)

function reissueQr() {
  startQrCountdown()
}

async function handleQrScanned() {
  if (!selectedCard.value || stage.value !== 'qr') return
  if (isQrExpired.value) {
    reissueQr()
    return
  }

  stopQrCountdown()
  stage.value = 'calculating'
  const amount = generateMockPaymentAmount()
  mockPaymentAmount.value = amount

  try {
    // 지어낸 결제 금액이지만, 혜택 금액은 실제 추천 API를 그 금액으로 다시 호출해서 진짜
    // 계산 로직으로 뽑는다 — 화면에 보이는 숫자가 서버 계산과 어긋나지 않게 하기 위해서다.
    const result = await fetchMerchantCardRecommendations(merchantId.value, amount)
    const matched = result.rankedCards.find(
      (card) => card.userCardId === selectedCard.value!.userCardId,
    )
    completedBenefitAmount.value = matched?.estimatedValueKrw ?? 0
  } catch {
    completedBenefitAmount.value = 0
  }

  stage.value = 'complete'
}

function returnToMap() {
  router.replace({ name: 'map' })
}
</script>

<template>
  <PageLayout title="결제하기" bg="background">
    <div v-if="isPending" class="flex h-full items-center justify-center">
      <LoaderCircle class="text-primary size-6 animate-spin" />
    </div>

    <div v-else-if="isError || !selectedCard" class="flex h-full items-center justify-center">
      <p class="text-caption text-gray">추천 카드를 불러오지 못했어요.</p>
    </div>

    <div
      v-else-if="stage === 'calculating'"
      class="flex h-full flex-col items-center justify-center gap-3"
    >
      <LoaderCircle class="size-6 animate-spin text-primary" />
      <p class="text-caption text-gray">실적에 반영하는 중...</p>
    </div>

    <div
      v-else-if="stage === 'complete'"
      class="flex h-full flex-col items-center justify-center gap-2 text-center"
    >
      <div
        class="flex size-16 items-center justify-center rounded-full bg-primary/8"
        aria-hidden="true"
      >
        <span class="flex size-12 items-center justify-center rounded-full bg-primary">
          <Check class="size-7 stroke-3 text-white" />
        </span>
      </div>

      <h1 class="mt-5 text-display text-charcoal">결제가 완료됐어요</h1>
      <p class="mt-1 text-body text-gray">{{ selectedCard!.cardName }}(으)로 결제했어요</p>

      <div class="mt-6 w-full rounded-lg border border-divider/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-caption text-gray">결제 금액</span>
          <span class="text-body font-bold text-charcoal">{{
            formatAmountWithUnit(mockPaymentAmount)
          }}</span>
        </div>
        <div class="my-3 border-t border-dashed border-divider" />
        <div class="flex items-center justify-between">
          <span class="text-caption text-gray">받은 혜택</span>
          <span class="text-subheading font-bold text-primary">{{
            formatAmountWithUnit(completedBenefitAmount)
          }}</span>
        </div>
      </div>
    </div>

    <div v-else class="flex h-full flex-col">
      <!-- 어디서 결제하는지: 가맹점 컨텍스트를 상단에 작게 고정 -->
      <div class="flex items-center gap-2.5 rounded-lg border border-divider/60 bg-card p-3">
        <div
          class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
          :class="brand ? 'bg-white' : 'bg-accent'"
          :style="brand ? { border: `2px solid ${brand.outlineColor ?? brand.fill}` } : undefined"
        >
          <img
            v-if="brand"
            :src="brand.logoUrl"
            :alt="`${merchantCategory} 로고`"
            class="size-5 object-contain"
          />
          <component
            v-else
            :is="categoryIcon[merchantCategory] ?? DEFAULT_CATEGORY_ICON"
            class="text-primary size-4"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-caption text-gray">지금 결제하는 곳</p>
          <p class="text-body truncate font-bold text-charcoal">{{ merchantName }}</p>
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="-translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
        >
          <div v-if="stage === 'qr'" class="flex flex-col items-center gap-1.5">
            <button
              type="button"
              class="relative rounded-lg border border-divider bg-card p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              :aria-label="isQrExpired ? 'QR 다시 받기' : 'QR을 스캔했다고 표시하기'"
              @click="handleQrScanned"
            >
              <MockQrCode :class="isQrExpired && 'opacity-30 grayscale'" />
              <div
                v-if="isQrExpired"
                class="absolute inset-0 flex flex-col items-center justify-center gap-1"
              >
                <RefreshCw class="size-6 text-charcoal" />
                <span class="text-label font-semibold text-charcoal">다시 받기</span>
              </div>
            </button>
            <p class="text-label" :class="isQrExpired ? 'text-error' : 'text-gray'">
              {{ isQrExpired ? '만료되었습니다' : `QR 유효시간 ${qrTimeLabel}` }}
            </p>
          </div>
        </Transition>

        <button
          type="button"
          class="rounded-sm transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          :class="stage === 'qr' && 'translate-y-2'"
          :disabled="rankedCards.length <= 1 || stage === 'qr'"
          :aria-label="rankedCards.length > 1 ? '다른 카드로 결제하려면 눌러주세요' : undefined"
          @click="isCardPickerOpen = true"
        >
          <CardImage
            :src="selectedCard.cardImageUrl"
            :alt="`${selectedCard.cardName} 카드 이미지`"
            class="drop-shadow-lg"
          />
        </button>

        <p class="text-heading font-bold text-charcoal">{{ selectedCard.cardName }}</p>

        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-body font-bold text-primary"
        >
          <BadgePercent class="size-4" />
          {{ formatRewardLabel(selectedCard) }}
        </span>
      </div>
    </div>

    <template v-if="stage === 'complete'" #footer>
      <MocaButton block class="h-14 rounded-md text-subheading!" @click="returnToMap">
        지도로 돌아가기
      </MocaButton>
    </template>
    <template v-else-if="stage !== 'calculating'" #footer>
      <p v-if="stage === 'qr'" class="text-center text-caption text-gray">
        매장 리더기에 QR을 보여주세요
      </p>
      <MocaButton
        v-else
        block
        class="h-14 gap-2 rounded-md text-subheading!"
        @click="confirmPayment"
      >
        <Lock class="size-4" />
        이 카드로 결제하기
      </MocaButton>
    </template>

    <Sheet v-model:open="isCardPickerOpen">
      <SheetContent
        side="bottom"
        class="mx-auto w-full gap-0 rounded-t-lg border-0 px-5 pt-4 pb-[max(2.5rem,var(--safe-area-bottom))] sm:max-w-[430px]"
      >
        <div class="mx-auto h-1 w-10 rounded-full bg-divider" aria-hidden="true" />

        <div class="pt-5 pb-4">
          <SheetTitle class="text-heading font-bold text-charcoal">카드 변경</SheetTitle>
          <SheetDescription class="sr-only">결제에 사용할 카드를 선택하세요</SheetDescription>
        </div>

        <ul class="scrollbar-hide -mx-5 max-h-[60vh] overflow-y-auto px-5">
          <li v-for="card in rankedCards" :key="card.userCardId">
            <button
              type="button"
              class="flex w-full items-center gap-3 border-b border-divider py-3 text-left last:border-b-0"
              @click="selectCard(card)"
            >
              <CardImage :src="card.cardImageUrl" :alt="`${card.cardName} 카드 이미지`" small />

              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-1.5">
                  <span class="truncate text-body font-bold text-charcoal">{{
                    card.cardName
                  }}</span>
                  <span
                    v-if="card.rank === 1"
                    class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-label font-bold text-primary"
                  >
                    MOCA 추천
                  </span>
                </p>
                <p class="mt-0.5 text-caption text-gray">{{ formatRewardLabel(card) }}</p>
              </div>

              <div
                v-if="card.userCardId === selectedCard?.userCardId"
                class="size-2.5 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>

    <CardPinDialog
      v-if="selectedCard"
      v-model:open="isPinDialogOpen"
      :card-name="selectedCard.cardName"
      @confirm="handlePinConfirmed"
    />
  </PageLayout>
</template>
