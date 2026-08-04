<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Pencil,
  ShoppingBag,
  SlidersHorizontal,
  Store,
} from '@lucide/vue'
import {
  getMockCardDetail,
  MOCK_CARD_DETAILS,
  type CardBenefitIcon,
} from '@/domains/card/mocks/cardDetails'
import AppBar from '@/shared/components/AppBar.vue'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'

const route = useRoute()
const router = useRouter()

const benefitIcons = {
  cafe: Coffee,
  convenience: Store,
  transit: Bus,
  subscription: ShoppingBag,
} satisfies Record<CardBenefitIcon, typeof Coffee>

const cardId = computed(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  return id ?? ''
})
const card = computed(() => getMockCardDetail(cardId.value) ?? MOCK_CARD_DETAILS[0] ?? null)

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <AppBar title="카드 상세" @back="goBack">
      <template #right>
        <button
          type="button"
          class="flex size-9 items-center justify-center"
          aria-label="혜택 필터"
        >
          <SlidersHorizontal class="size-5" aria-hidden="true" />
        </button>
      </template>
    </AppBar>

    <main v-if="card" class="min-h-0 flex-1 overflow-y-auto">
      <section class="border-b border-divider" aria-label="카드 이미지">
        <div class="mt-4 flex h-2 items-center justify-center gap-2">
          <span class="h-1.5 w-5 rounded-full bg-primary" aria-hidden="true" />
          <span class="size-1.5 rounded-full bg-disabled" aria-hidden="true" />
          <span class="size-1.5 rounded-full bg-disabled" aria-hidden="true" />
        </div>

        <div class="relative flex min-h-88 items-center justify-center px-16 pb-5 pt-4">
          <button
            type="button"
            class="absolute left-5 flex size-12 items-center justify-center rounded-full bg-screen text-disabled"
            aria-label="이전 카드"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </button>

          <CardImage
            :src="card.imageUrl"
            :alt="`${card.name} 카드 이미지`"
            :width="145"
            :height="234"
            class="rounded-md shadow-card"
          />

          <button
            type="button"
            class="absolute right-5 flex size-12 items-center justify-center rounded-full bg-secondary text-charcoal"
            aria-label="다음 카드"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="border-b border-divider px-7 py-5" aria-labelledby="card-name">
        <h1 id="card-name" class="text-heading">{{ card.name }}</h1>
        <p class="mt-1 text-body text-gray">{{ card.issuerName }} · •••• {{ card.last4 }}</p>
        <p class="mt-3 text-body text-charcoal">{{ card.description }}</p>
        <p class="mt-4 text-caption text-gray">최종 갱신 {{ card.updatedAt }}</p>
      </section>

      <section class="border-b border-divider px-7 py-5" aria-labelledby="card-memo-title">
        <div class="flex items-center justify-between">
          <h2 id="card-memo-title" class="text-subheading">메모</h2>
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full bg-[#F2EDFF] text-primary"
            aria-label="메모 수정"
          >
            <Pencil class="size-4" aria-hidden="true" />
          </button>
        </div>
        <p class="mt-3 text-body text-charcoal">{{ card.memo }}</p>
      </section>

      <section class="border-b border-divider py-5" aria-labelledby="card-benefit-title">
        <h2 id="card-benefit-title" class="px-7 text-heading">주요 혜택</h2>

        <ul class="mt-4">
          <li v-for="(benefit, index) in card.benefits" :key="benefit.id">
            <div class="flex items-center gap-3 px-7 py-3">
              <span
                class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <component :is="benefitIcons[benefit.icon]" class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-caption text-gray">{{ benefit.category }}</p>
                <p class="text-subheading">{{ benefit.title }}</p>
              </div>
              <p class="shrink-0 text-caption text-gray">{{ benefit.condition }}</p>
              <ChevronDown
                v-if="index === 0"
                class="size-4 shrink-0 text-gray"
                aria-hidden="true"
              />
              <ChevronRight v-else class="size-4 shrink-0 text-gray" aria-hidden="true" />
            </div>

            <div
              v-if="benefit.description"
              class="mx-7 mb-3 rounded-md bg-screen px-4 py-4 text-body leading-6 text-gray"
            >
              {{ benefit.description }}. 월 최대 5,000원.
            </div>
          </li>
        </ul>
      </section>

      <section class="pb-8 pt-5" aria-labelledby="card-notice-title">
        <h2 id="card-notice-title" class="px-7 text-heading">유의 사항</h2>
        <div class="mt-4 bg-screen px-7 py-5">
          <p class="mb-2 text-body text-gray">할인서비스 적용 안내</p>
          <ul class="space-y-1 text-caption leading-5 text-gray">
            <li v-for="notice in card.notices" :key="notice">- {{ notice }}</li>
          </ul>
        </div>
      </section>
    </main>

    <BottomBar active-path="/home" />
  </div>
</template>
