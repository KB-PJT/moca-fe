<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from 'vue'
import { ChevronRight } from '@lucide/vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'
import CardImage from '@/shared/components/CardImage.vue'

const CARD_WIDTH = 184
const CARD_HEIGHT = 296
const CARD_STEP = 170
const SWIPE_THRESHOLD = 44

interface Props {
  cards: HomeOwnedCard[]
  activeIndex?: number
  activeMemo?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeIndex: 0,
  activeMemo: '',
})

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  'open-benefit-detail': []
}>()

const viewport = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragOffsetX = ref(0)
const virtualActiveIndex = ref(props.activeIndex)

const renderedCards = computed(() => {
  const cardCount = props.cards.length
  if (cardCount === 0) return []
  if (cardCount === 1) {
    return [{ card: props.cards[0]!, cardIndex: 0, virtualIndex: virtualActiveIndex.value }]
  }
  if (cardCount === 2) {
    return props.cards.map((card, cardIndex) => ({ card, cardIndex, virtualIndex: cardIndex }))
  }

  return [-2, -1, 0, 1, 2].map((offset) => {
    const virtualIndex = virtualActiveIndex.value + offset
    const cardIndex = normalizeIndex(virtualIndex)

    return { card: props.cards[cardIndex]!, cardIndex, virtualIndex }
  })
})

let dragStartX = 0
let suppressClickUntil = 0

function normalizeIndex(index: number) {
  const cardCount = props.cards.length
  if (cardCount === 0) return 0
  return ((index % cardCount) + cardCount) % cardCount
}

function resolveCardStyle(virtualIndex: number): CSSProperties {
  const distance = virtualIndex - virtualActiveIndex.value + dragOffsetX.value / CARD_STEP
  const absoluteDistance = Math.abs(distance)
  const direction = Math.sign(distance)
  const curvedDistance = Math.min(absoluteDistance, 2)
  const translateX =
    direction *
    (curvedDistance <= 1 ? curvedDistance * CARD_STEP : CARD_STEP + (curvedDistance - 1) * 52)
  const translateZ = 20 - curvedDistance * 90
  const rotation = direction * Math.min(68, curvedDistance * 46)
  const scale = Math.max(0.64, 1 - curvedDistance * 0.16)
  const inactiveRatio = Math.min(absoluteDistance, 1)
  const opacity = Number((1 - inactiveRatio * 0.34).toFixed(2))
  const brightness = (1.02 - inactiveRatio * 0.16).toFixed(2)
  const saturation = (1.04 - inactiveRatio * 0.34).toFixed(2)
  const contrast = (1.04 - inactiveRatio * 0.1).toFixed(2)
  const blur = (inactiveRatio * 0.35).toFixed(2)

  return {
    zIndex: Math.max(0, 100 - Math.round(absoluteDistance * 10)),
    opacity: absoluteDistance >= 2 ? 0 : opacity,
    filter: `brightness(${brightness}) saturate(${saturation}) contrast(${contrast}) blur(${blur}px)`,
    visibility: absoluteDistance >= 2 ? 'hidden' : 'visible',
    pointerEvents: absoluteDistance > 1.5 ? 'none' : 'auto',
    transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotation}deg) scale(${scale})`,
  }
}

function startDrag(event: PointerEvent) {
  if ((event.pointerType === 'mouse' && event.button !== 0) || !viewport.value) return
  const interactiveTarget = (event.target as HTMLElement).closest('a, button')
  if (interactiveTarget && !interactiveTarget.matches('[data-card-visual]')) return

  isDragging.value = true
  dragStartX = event.clientX
  dragOffsetX.value = 0
}

function moveDrag(event: PointerEvent) {
  if (!isDragging.value || !viewport.value) return

  let dragDistance = event.clientX - dragStartX
  if (Math.abs(dragDistance) > 4 && !viewport.value.hasPointerCapture(event.pointerId)) {
    viewport.value.setPointerCapture(event.pointerId)
  }
  if (
    props.cards.length <= 2 &&
    ((virtualActiveIndex.value === 0 && dragDistance > 0) ||
      (virtualActiveIndex.value === props.cards.length - 1 && dragDistance < 0))
  ) {
    dragDistance *= 0.24
  }
  dragOffsetX.value = Math.min(Math.max(dragDistance, -CARD_STEP), CARD_STEP)
}

function finishDrag(event: PointerEvent) {
  if (!isDragging.value || !viewport.value) return

  const completedOffset = dragOffsetX.value
  isDragging.value = false
  dragOffsetX.value = 0
  if (viewport.value.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }

  if (Math.abs(completedOffset) < SWIPE_THRESHOLD) return
  suppressClickUntil = Date.now() + 250
  moveToVirtualCard(virtualActiveIndex.value + (completedOffset < 0 ? 1 : -1))
}

function cancelDrag(event: PointerEvent) {
  if (!isDragging.value || !viewport.value) return

  isDragging.value = false
  dragOffsetX.value = 0
  if (viewport.value.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }
}

function activateVirtualCard(virtualIndex: number) {
  if (Date.now() < suppressClickUntil) return
  if (virtualIndex === virtualActiveIndex.value) {
    emit('open-benefit-detail')
    return
  }

  moveToVirtualCard(virtualIndex)
}

function moveToVirtualCard(virtualIndex: number) {
  if (props.cards.length <= 2 && (virtualIndex < 0 || virtualIndex >= props.cards.length)) return
  if (virtualIndex === virtualActiveIndex.value) return

  virtualActiveIndex.value = virtualIndex
  emit('update:activeIndex', normalizeIndex(virtualIndex))
}

watch(
  () => [props.activeIndex, props.cards.length] as const,
  ([activeIndex]) => {
    if (props.cards.length === 0) {
      virtualActiveIndex.value = 0
      return
    }

    const normalizedCurrentIndex = normalizeIndex(virtualActiveIndex.value)
    const normalizedNextIndex = normalizeIndex(activeIndex)
    if (normalizedCurrentIndex === normalizedNextIndex) return
    if (props.cards.length <= 2) {
      virtualActiveIndex.value = normalizedNextIndex
      return
    }

    let distance = normalizedNextIndex - normalizedCurrentIndex
    const half = props.cards.length / 2
    if (distance > half) distance -= props.cards.length
    if (distance < -half) distance += props.cards.length
    virtualActiveIndex.value += distance
  },
)
</script>

<template>
  <div
    ref="viewport"
    data-card-carousel
    class="touch-none relative isolate h-[328px] cursor-grab overflow-hidden select-none active:cursor-grabbing"
    aria-label="보유 카드 목록"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="finishDrag"
    @pointercancel="cancelDrag"
    @dragstart.prevent
  >
    <ul
      class="relative h-full w-full"
      :style="{ perspective: '650px', transformStyle: 'preserve-3d' }"
    >
      <li
        v-for="renderedCard in renderedCards"
        :key="renderedCard.virtualIndex"
        data-owned-card
        :data-card-index="renderedCard.cardIndex"
        class="absolute top-4 left-1/2 w-[184px] transform-gpu transition-[transform,opacity,filter] will-change-transform"
        :class="[
          renderedCard.virtualIndex === virtualActiveIndex ? '' : 'cursor-pointer',
          isDragging
            ? 'duration-0'
            : 'duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        ]"
        :style="resolveCardStyle(renderedCard.virtualIndex)"
        :aria-current="renderedCard.virtualIndex === virtualActiveIndex ? 'true' : undefined"
        :aria-hidden="Math.abs(renderedCard.virtualIndex - virtualActiveIndex) >= 2 || undefined"
      >
        <button
          type="button"
          data-card-visual
          class="relative block h-[296px] w-[184px] appearance-none rounded-sm border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          :tabindex="Math.abs(renderedCard.virtualIndex - virtualActiveIndex) <= 1 ? 0 : -1"
          :aria-label="
            renderedCard.virtualIndex === virtualActiveIndex
              ? `${renderedCard.card.name} 혜택 상세 보기`
              : `${renderedCard.card.name} 카드 선택`
          "
          @click="activateVirtualCard(renderedCard.virtualIndex)"
        >
          <CardImage
            :src="renderedCard.card.imageUrl"
            :alt="`${renderedCard.card.name} 카드 이미지`"
            :width="CARD_WIDTH"
            :height="CARD_HEIGHT"
            class="rounded-sm shadow-card"
          />
        </button>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-2 opacity-0"
        >
          <RouterLink
            v-if="renderedCard.virtualIndex === virtualActiveIndex"
            :to="{
              name: 'card-detail',
              params: { id: renderedCard.card.id },
              query: { from: 'home' },
            }"
            class="absolute -left-5 bottom-0 isolate flex min-h-16 w-[calc(100%+40px)] items-center justify-between gap-3 overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(112deg,rgba(255,250,246,0.78)_0%,rgba(243,219,203,0.72)_100%)] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[18px] backdrop-saturate-150 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_92%_88%,rgba(255,255,255,0.9),transparent_30%)]"
            :aria-label="`${renderedCard.card.name} 메모 확인하기`"
          >
            <p
              data-card-memo
              class="relative z-10 min-w-0 whitespace-pre-line text-caption leading-5 font-semibold text-charcoal"
            >
              {{ activeMemo }}
            </p>
            <ChevronRight class="relative z-10 size-5 shrink-0 text-brown" aria-hidden="true" />
          </RouterLink>
        </Transition>
      </li>
    </ul>

    <span
      data-carousel-edge-fade
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 left-0 z-[110] w-9 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.74)_34%,rgba(255,255,255,0)_100%)]"
    />
    <span
      data-carousel-edge-fade
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 right-0 z-[110] w-9 bg-[linear-gradient(270deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.74)_34%,rgba(255,255,255,0)_100%)]"
    />
  </div>
</template>
