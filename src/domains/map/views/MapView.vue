<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { List, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'

const mapContainer = ref<HTMLElement | null>(null)
let script: HTMLScriptElement | null = null

const categories = ['전체', '음식점', '카페', '편의점', '마트']
const activeCategory = ref('전체')
const viewMode = ref<'map' | 'list'>('map')

function initMap() {
  if (!mapContainer.value) return

  const center = new window.kakao.maps.LatLng(37.5481533, 127.0733985) // 멀티캠퍼스 세종대
  new window.kakao.maps.Map(mapContainer.value, {
    center,
    level: 4,
  })
}

onMounted(() => {
  if (window.kakao?.maps) {
    window.kakao.maps.load(initMap)
    return
  }

  script = document.createElement('script')
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false`
  script.onload = () => window.kakao.maps.load(initMap)
  document.head.appendChild(script)
})

onUnmounted(() => {
  script?.remove()
})
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="mapContainer" class="h-full w-full" />

    <div
      class="bg-linear-to-b pointer-events-none absolute inset-x-0 top-0 z-10 h-40 from-black/35 to-transparent"
    />

    <div class="absolute inset-x-0 top-0 z-10 space-y-3 p-4">
      <div class="bg-card shadow-float flex items-center gap-2 rounded-md px-3">
        <Search class="text-gray size-4 shrink-0" />
        <Input
          placeholder="역삼동 · 내 주변 혜택 가맹점"
          class="border-0 px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div class="flex gap-2">
        <div class="bg-card flex shrink-0 items-center rounded-full p-1">
          <button
            type="button"
            class="text-caption flex items-center gap-1 rounded-full px-3 py-1.5 whitespace-nowrap"
            :class="viewMode === 'map' ? 'bg-primary text-white' : 'text-gray'"
            @click="viewMode = 'map'"
          >
            <MapIcon class="size-4" />
            지도
          </button>
          <button
            type="button"
            class="text-caption flex items-center gap-1 rounded-full px-3 py-1.5 whitespace-nowrap"
            :class="viewMode === 'list' ? 'bg-primary text-white' : 'text-gray'"
            @click="viewMode = 'list'"
          >
            <List class="size-4" />
            목록
          </button>
        </div>

        <div class="scrollbar-hide flex gap-2 overflow-x-auto">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            class="text-caption shrink-0 rounded-full px-3 py-1.5 whitespace-nowrap"
            :class="activeCategory === category ? 'bg-primary text-white' : 'bg-card text-charcoal'"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
