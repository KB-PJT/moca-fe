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

let didMouseDrag = false
let dragStartX = 0

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

  return {
    zIndex: Math.max(0, 100 - Math.round(absoluteDistance * 10)),
    opacity: absoluteDistance >= 2 ? 0 : Math.max(0.5, 1 - absoluteDistance * 0.16),
    visibility: absoluteDistance >= 2 ? 'hidden' : 'visible',
    pointerEvents: absoluteDistance > 1.5 ? 'none' : 'auto',
    transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotation}deg) scale(${scale})`,
  }
}

function startDrag(event: PointerEvent) {
  if ((event.pointerType === 'mouse' && event.button !== 0) || !viewport.value) return
  if ((event.target as HTMLElement).closest('a, button')) return

  isDragging.value = true
  didMouseDrag = false
  dragStartX = event.clientX
  dragOffsetX.value = 0
  viewport.value.setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (!isDragging.value || !viewport.value) return

  let dragDistance = event.clientX - dragStartX
  if (Math.abs(dragDistance) > 4) didMouseDrag = true
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
  moveToVirtualCard(virtualActiveIndex.value + (completedOffset < 0 ? 1 : -1))
}

function cancelDrag(event: PointerEvent) {
  if (!isDragging.value || !viewport.value) return

  isDragging.value = false
  dragOffsetX.value = 0
  didMouseDrag = false
  if (viewport.value.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }
}

function selectVirtualCard(virtualIndex: number) {
  if (didMouseDrag) {
    didMouseDrag = false
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
    class="touch-none relative h-[328px] cursor-grab overflow-hidden select-none active:cursor-grabbing"
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
        class="absolute top-4 left-1/2 w-[184px] transform-gpu transition-[transform,opacity] will-change-transform"
        :class="[
          renderedCard.virtualIndex === virtualActiveIndex ? '' : 'cursor-pointer',
          isDragging
            ? 'duration-0'
            : 'duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        ]"
        :style="resolveCardStyle(renderedCard.virtualIndex)"
        :aria-current="renderedCard.virtualIndex === virtualActiveIndex ? 'true' : undefined"
        :aria-hidden="Math.abs(renderedCard.virtualIndex - virtualActiveIndex) >= 2 || undefined"
        :aria-label="
          renderedCard.virtualIndex === virtualActiveIndex
            ? undefined
            : `${renderedCard.card.name} 카드 선택`
        "
        :role="renderedCard.virtualIndex === virtualActiveIndex ? undefined : 'button'"
        :tabindex="Math.abs(renderedCard.virtualIndex - virtualActiveIndex) === 1 ? 0 : undefined"
        @click="selectVirtualCard(renderedCard.virtualIndex)"
        @keydown.enter.prevent="selectVirtualCard(renderedCard.virtualIndex)"
        @keydown.space.prevent="selectVirtualCard(renderedCard.virtualIndex)"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 top-0.5 h-[292px] rounded-lg ring-1 ring-primary/15 shadow-[0_0_10px_3px_rgba(255,136,54,0.24)] transition-opacity duration-300"
          :class="renderedCard.virtualIndex === virtualActiveIndex ? 'opacity-100' : 'opacity-0'"
        />

        <CardImage
          :src="renderedCard.card.imageUrl"
          :alt="`${renderedCard.card.name} 카드 이미지`"
          :width="CARD_WIDTH"
          :height="CARD_HEIGHT"
          class="rounded-lg shadow-card"
        />

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
            class="absolute -left-2.5 bottom-0 flex min-h-16 w-[calc(100%+20px)] items-center justify-between gap-2 rounded-sm bg-[#F7E9DF]/95 px-4 py-3 shadow-card backdrop-blur-sm"
            :aria-label="`${renderedCard.card.name} 메모 확인하기`"
          >
            <p
              data-card-memo
              class="min-w-0 whitespace-pre-line text-caption font-semibold text-charcoal"
            >
              {{ activeMemo }}
            </p>
            <ChevronRight class="size-4 shrink-0 text-brown" aria-hidden="true" />
          </RouterLink>
        </Transition>
      </li>
    </ul>
  </div>
</template>
