<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import defaultCardImageUrl from '@/assets/img/img_default_card.png'

const LARGE_CARD_SIZE = { width: 200, height: 322 } as const
const SMALL_CARD_SIZE = { width: 40, height: 64 } as const

interface Props {
  src?: string | null
  alt?: string
  small?: boolean
  width?: number | string
  height?: number | string
  orientation?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  alt: '',
  small: false,
  orientation: 'vertical',
})

const displayedSrc = ref(defaultCardImageUrl)
const presetSize = computed(() => (props.small ? SMALL_CARD_SIZE : LARGE_CARD_SIZE))
const resolvedWidth = computed(() => {
  if (props.width !== undefined) return normalizeSize(props.width)
  const width =
    props.orientation === 'horizontal' ? presetSize.value.height : presetSize.value.width
  return normalizeSize(width)
})
const resolvedHeight = computed(() => {
  if (props.height !== undefined) return normalizeSize(props.height)
  const height =
    props.orientation === 'horizontal' ? presetSize.value.width : presetSize.value.height
  return normalizeSize(height)
})
const frameStyle = computed(() => ({
  width: resolvedWidth.value,
  height: resolvedHeight.value,
}))
const imageStyle = computed(() => {
  if (props.orientation === 'horizontal') {
    return {
      width: resolvedHeight.value,
      height: resolvedWidth.value,
      transform: 'rotate(90deg)',
    }
  }

  return {
    width: '100%',
    height: '100%',
  }
})

function normalizeSize(size?: number | string) {
  if (typeof size === 'number') return `${size}px`
  return size?.trim() || undefined
}

watch(
  () => props.src,
  (src) => {
    displayedSrc.value = src?.trim() || defaultCardImageUrl
  },
  { immediate: true },
)

function useDefaultImage() {
  if (displayedSrc.value !== defaultCardImageUrl) {
    displayedSrc.value = defaultCardImageUrl
  }
}
</script>

<template>
  <span
    data-slot="card-image"
    class="inline-flex items-center justify-center overflow-hidden"
    :style="frameStyle"
  >
    <img
      :src="displayedSrc"
      :alt="alt"
      class="max-w-none object-contain"
      :style="imageStyle"
      @error="useDefaultImage"
    />
  </span>
</template>
