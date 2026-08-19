<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronRight, X } from '@lucide/vue'
import { fetchCardDetail, type CardDetailBenefitResponse } from '@/domains/card/api/cardDetail'
import { resolveCardBenefitIcon } from '@/domains/card/constants/benefitCategories'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'
import CardImage from '@/shared/components/CardImage.vue'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog'

const props = withDefaults(
  defineProps<{
    card: HomeOwnedCard | null
    benefitTitle?: string
  }>(),
  {
    benefitTitle: '',
  },
)

const open = defineModel<boolean>('open', { default: false })
const benefits = ref<CardDetailBenefitResponse[]>([])
const isBenefitsLoading = ref(false)
const benefitsError = ref('')
let benefitRequestId = 0

const displayedBenefits = computed(() => {
  if (benefits.value.length > 0) return benefits.value.slice(0, 3)
  if (isBenefitsLoading.value || benefitsError.value || !props.benefitTitle.trim()) return []

  return [
    {
      benefitId: 'highlight-benefit',
      title: props.benefitTitle,
      summary: null,
      detailText: null,
      detailHtml: null,
    },
  ]
})

const remainingBenefitCount = computed(() =>
  Math.max(benefits.value.length - displayedBenefits.value.length, 0),
)

const surfaceStyle = computed(() => ({
  '--card-accent': props.card?.accentColor ?? '#FF8836',
}))

async function loadBenefits(cardId: string) {
  const requestId = ++benefitRequestId
  benefits.value = []
  benefitsError.value = ''
  isBenefitsLoading.value = true

  try {
    const cardDetail = await fetchCardDetail(cardId)
    if (requestId !== benefitRequestId) return
    benefits.value = cardDetail.benefits
  } catch {
    if (requestId !== benefitRequestId) return
    benefits.value = []
    benefitsError.value = '카드 혜택을 불러오지 못했어요.'
  } finally {
    if (requestId === benefitRequestId) isBenefitsLoading.value = false
  }
}

function retryBenefits() {
  if (!open.value || !props.card?.id) return
  void loadBenefits(props.card.id)
}

watch(
  [open, () => props.card?.id],
  ([isOpen, cardId]) => {
    benefits.value = []
    benefitsError.value = ''

    if (!isOpen || !cardId) {
      benefitRequestId += 1
      isBenefitsLoading.value = false
      return
    }

    void loadBenefits(cardId)
  },
  { immediate: true },
)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      data-card-benefit-dialog
      :show-close-button="false"
      class="card-benefit-dialog top-1/2 left-1/2 max-h-[calc(100dvh-3rem)] w-[calc(100%-2.5rem)] max-w-[335px] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-y-auto rounded-[32px] border border-white/70 bg-transparent p-0 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:max-w-[335px]"
    >
      <article
        v-if="card"
        class="benefit-dialog-surface relative overflow-hidden rounded-[31px] px-6 pt-7 pb-6"
        :style="surfaceStyle"
      >
        <span class="benefit-card-glow" aria-hidden="true" />
        <DialogTitle class="sr-only">{{ card.name }} 혜택 상세</DialogTitle>
        <DialogDescription class="sr-only"> 선택한 카드의 주요 혜택 요약 </DialogDescription>

        <DialogClose as-child>
          <button
            type="button"
            class="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-white/55 text-charcoal backdrop-blur-md transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="혜택 상세 닫기"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </DialogClose>

        <div data-card-benefit-summary class="relative z-10">
          <p class="text-caption font-semibold text-brown">카드 한눈에</p>
          <div class="mt-5 flex items-center gap-4 pr-5">
            <CardImage
              :src="card.imageUrl"
              :alt="`${card.name} 카드 이미지`"
              :width="72"
              :height="116"
              class="shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-caption leading-5 text-gray">{{ card.name }}</p>
              <h2 class="mt-2 text-heading leading-7 font-bold text-charcoal">
                {{ benefitTitle || '적용 가능한 혜택을 확인해 보세요' }}
              </h2>
            </div>
          </div>
        </div>

        <section
          data-benefit-summary-list
          class="relative z-10 mt-6"
          aria-labelledby="benefit-list-title"
          aria-live="polite"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 id="benefit-list-title" class="text-body font-bold text-charcoal">주요 혜택</h2>
            <span v-if="remainingBenefitCount > 0" class="text-caption text-gray">
              외 {{ remainingBenefitCount }}개
            </span>
          </div>

          <div
            v-if="isBenefitsLoading"
            class="mt-2 divide-y divide-charcoal/8"
            aria-label="혜택 불러오는 중"
          >
            <div v-for="index in 3" :key="index" class="flex items-center gap-3 py-3">
              <span class="size-9 shrink-0 animate-pulse rounded-full bg-white/55" />
              <span class="min-w-0 flex-1 space-y-2">
                <span class="block h-3 w-2/3 animate-pulse rounded-full bg-white/65" />
                <span class="block h-2.5 w-full animate-pulse rounded-full bg-white/45" />
              </span>
            </div>
          </div>

          <div
            v-else-if="benefitsError"
            data-benefit-summary-error
            class="mt-3 rounded-xl bg-white/42 px-4 py-5 text-center backdrop-blur-sm"
            role="alert"
          >
            <p class="text-caption text-gray">{{ benefitsError }}</p>
            <button
              type="button"
              class="mt-3 min-h-9 rounded-full bg-white/68 px-4 text-caption font-semibold text-charcoal transition-colors hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="retryBenefits"
            >
              다시 시도
            </button>
          </div>

          <ul v-else-if="displayedBenefits.length > 0" class="mt-2 divide-y divide-charcoal/8">
            <li
              v-for="benefit in displayedBenefits"
              :key="benefit.benefitId"
              data-benefit-summary-item
              class="flex items-center gap-3 py-3"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/58 text-brown backdrop-blur-sm"
                aria-hidden="true"
              >
                <component :is="resolveCardBenefitIcon(benefit)" class="size-4" />
              </span>
              <span class="min-w-0 flex-1">
                <strong class="block line-clamp-1 text-body font-semibold text-charcoal">
                  {{ benefit.title }}
                </strong>
                <span
                  v-if="benefit.summary"
                  class="mt-0.5 block line-clamp-1 text-caption text-gray"
                >
                  {{ benefit.summary }}
                </span>
              </span>
            </li>
          </ul>

          <p
            v-else
            class="mt-3 rounded-xl bg-white/42 px-4 py-5 text-center text-caption text-gray"
          >
            등록된 주요 혜택이 없어요.
          </p>
        </section>

        <RouterLink
          :to="{ name: 'card-detail', params: { id: card.id }, query: { from: 'home' } }"
          class="relative z-10 mt-4 flex min-h-13 items-center justify-center gap-1 rounded-xl bg-white/58 px-5 text-body font-bold text-charcoal backdrop-blur-md transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          혜택 더 보기
          <ChevronRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </article>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.benefit-dialog-surface {
  background:
    radial-gradient(
      circle at 86% 12%,
      color-mix(in srgb, var(--card-accent) 22%, transparent),
      transparent 38%
    ),
    radial-gradient(circle at 8% 92%, rgb(249 209 255 / 48%), transparent 42%),
    linear-gradient(145deg, #effdfc 0%, #e5f5ff 48%, #f4edff 100%);
}

.benefit-card-glow {
  position: absolute;
  width: 8rem;
  height: 8rem;
  right: -2.5rem;
  top: 5rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--card-accent) 18%, transparent);
  filter: blur(18px);
}
</style>

<style>
.card-benefit-dialog[data-state='open'] {
  transform-origin: center 34%;
  animation: card-benefit-flip-in 650ms cubic-bezier(0.4, 0, 0.2, 1) both !important;
}

.card-benefit-dialog[data-state='closed'] {
  transform-origin: center 34%;
  animation: card-benefit-flip-out 240ms ease-in both !important;
}

@keyframes card-benefit-flip-in {
  from {
    opacity: 0;
    border-radius: 2rem;
    transform: perspective(1400px) rotateY(-88deg) scale(0.78);
  }

  to {
    opacity: 1;
    border-radius: 2rem;
    transform: perspective(1400px) rotateY(0deg) scale(1);
  }
}

@keyframes card-benefit-flip-out {
  from {
    opacity: 1;
    transform: perspective(1400px) rotateY(0deg) scale(1);
  }

  to {
    opacity: 0;
    transform: perspective(1400px) rotateY(70deg) scale(0.86);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-benefit-dialog[data-state='open'],
  .card-benefit-dialog[data-state='closed'] {
    animation-duration: 0.01ms !important;
  }
}
</style>
