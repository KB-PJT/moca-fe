<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from '@lucide/vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'
import CardImage from '@/shared/components/CardImage.vue'

const CARD_WIDTH = 200
const CARD_GAP = 28

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
const trackStyle = {
  paddingInline: `calc(50% - ${CARD_WIDTH / 2}px)`,
}

let isMouseDragging = false
let dragStartX = 0
let dragStartScrollLeft = 0

function resolveActiveIndex() {
  if (!viewport.value || props.cards.length === 0) return 0

  const index = Math.round(viewport.value.scrollLeft / (CARD_WIDTH + CARD_GAP))
  return Math.min(Math.max(index, 0), props.cards.length - 1)
}

function updateActiveIndex() {
  const index = resolveActiveIndex()
  if (index !== props.activeIndex) emit('update:activeIndex', index)
}

function startMouseDrag(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !viewport.value) return
  if ((event.target as HTMLElement).closest('a, button')) return

  isMouseDragging = true
  dragStartX = event.clientX
  dragStartScrollLeft = viewport.value.scrollLeft
  viewport.value.setPointerCapture(event.pointerId)
}

function moveMouseDrag(event: PointerEvent) {
  if (!isMouseDragging || !viewport.value) return

  viewport.value.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX)
}

function finishMouseDrag(event: PointerEvent) {
  if (!isMouseDragging || !viewport.value) return

  isMouseDragging = false
  if (viewport.value.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }

  const index = resolveActiveIndex()
  viewport.value.scrollTo({
    left: index * (CARD_WIDTH + CARD_GAP),
    behavior: 'smooth',
  })
  if (index !== props.activeIndex) emit('update:activeIndex', index)
}
</script>

<template>
  <div
    ref="viewport"
    data-card-carousel
    class="scrollbar-hide touch-pan-x cursor-grab snap-x snap-mandatory scroll-smooth overflow-x-auto overscroll-x-contain select-none active:cursor-grabbing"
    aria-label="보유 카드 목록"
    @scroll.passive="updateActiveIndex"
    @pointerdown="startMouseDrag"
    @pointermove="moveMouseDrag"
    @pointerup="finishMouseDrag"
    @pointercancel="finishMouseDrag"
    @dragstart.prevent
  >
    <ul class="flex w-max gap-7" :style="trackStyle">
      <li
        v-for="(card, index) in cards"
        :key="card.id"
        data-owned-card
        class="relative w-50 shrink-0 snap-center"
        :aria-current="index === activeIndex ? 'true' : undefined"
      >
        <CardImage
          :src="card.imageUrl"
          :alt="`${card.name} 카드 이미지`"
          :width="CARD_WIDTH"
          :height="322"
          class="rounded-lg shadow-card transition-[transform,opacity] duration-300 ease-out"
          :class="index === activeIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-75'"
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
            v-if="index === activeIndex"
            :to="{ name: 'card-detail', params: { id: card.id } }"
            class="absolute -left-2.5 bottom-0 flex min-h-16 w-55 items-center justify-between gap-2 rounded-sm bg-[#F7E9DF]/95 px-4 py-3 shadow-card backdrop-blur-sm"
            :aria-label="`${card.name} 메모 확인하기`"
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
