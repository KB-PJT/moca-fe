<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { List, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { merchants, type Merchant } from '@/domains/map/api/merchants.mock'
import { dotMarkerImage, pinMarkerImage } from '@/domains/map/composables/markerIcon'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clusterer: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markerByPlaceId = new Map<string, any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let selectedMarker: any = null
const mapContainer = ref<HTMLElement | null>(null)
const controlsRef = ref<HTMLElement | null>(null)
const sheetRef = ref<HTMLElement | null>(null)
let script: HTMLScriptElement | null = null

const categories = ['전체', '음식점', '카페', '편의점', '마트']
const activeCategory = ref('전체')
const viewMode = ref<'map' | 'list'>('map')
const selectedMerchant = ref<Merchant | null>(null)

// 선택한 마커가 상단 컨트롤 영역 아래 ~ 열린 하단 시트 위 사이 정중앙에 오도록 지도를 이동
function focusMarker(merchant: Merchant) {
  if (!mapInstance || !mapContainer.value || !controlsRef.value || !sheetRef.value) return

  const mapRect = mapContainer.value.getBoundingClientRect()
  const controlsRect = controlsRef.value.getBoundingClientRect()
  // 시트가 translate-y-full로 화면 밖에 있어도 실제 box 높이 자체는 transform 영향을 안 받는다.
  const sheetHeight = sheetRef.value.getBoundingClientRect().height

  const targetX = mapRect.width / 2
  const sheetTopY = mapRect.height - sheetHeight
  const targetY = (controlsRect.bottom - mapRect.top + sheetTopY) / 2

  const projection = mapInstance.getProjection()
  const markerPoint = projection.containerPointFromCoords(
    new window.kakao.maps.LatLng(merchant.latitude, merchant.longitude),
  )
  const centerPoint = projection.containerPointFromCoords(mapInstance.getCenter())

  const newCenterPoint = new window.kakao.maps.Point(
    centerPoint.x - (targetX - markerPoint.x),
    centerPoint.y - (targetY - markerPoint.y),
  )

  mapInstance.panTo(projection.coordsFromContainerPoint(newCenterPoint))
}

async function selectMerchant(merchant: Merchant) {
  const marker = markerByPlaceId.get(merchant.placeId)
  if (!marker) return

  if (selectedMarker && selectedMarker !== marker) {
    selectedMarker.setImage(dotMarkerImage())
  }

  marker.setImage(pinMarkerImage(merchant.category))
  selectedMarker = marker
  selectedMerchant.value = merchant

  // 시트가 처음 열리는 경우 DOM에 반영될 때까지 기다렸다가 높이를 재야 한다.
  await nextTick()
  focusMarker(merchant)
}

function closeSheet() {
  if (selectedMarker) {
    selectedMarker.setImage(dotMarkerImage())
    selectedMarker = null
  }
  selectedMerchant.value = null
}

function updateMarkers() {
  if (!mapInstance) return

  clusterer?.clear()
  markerByPlaceId.clear()

  const filtered =
    activeCategory.value === '전체'
      ? merchants
      : merchants.filter((merchant) => merchant.category === activeCategory.value)

  if (selectedMerchant.value && !filtered.includes(selectedMerchant.value)) {
    closeSheet()
  }

  const markers = filtered.map((merchant) => {
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(merchant.latitude, merchant.longitude),
      image: dotMarkerImage(),
    })

    markerByPlaceId.set(merchant.placeId, marker)
    window.kakao.maps.event.addListener(marker, 'click', () => selectMerchant(merchant))

    return marker
  })

  // 마커가 겹칠 정도로 가까이 모이면 숫자 배지로 묶어서 표시
  clusterer = new window.kakao.maps.MarkerClusterer({
    map: mapInstance,
    markers,
    averageCenter: true,
    minLevel: 5,
  })
}

function initMap() {
  if (!mapContainer.value) return

  const center = new window.kakao.maps.LatLng(37.5481533, 127.0733985)
  mapInstance = new window.kakao.maps.Map(mapContainer.value, { center, level: 4 })

  window.kakao.maps.event.addListener(mapInstance, 'click', () => {
    if (selectedMerchant.value) closeSheet()
  })

  updateMarkers()
}

watch(activeCategory, updateMarkers)

onMounted(() => {
  if (window.kakao?.maps) {
    window.kakao.maps.load(initMap)
    return
  }

  script = document.createElement('script')
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`
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
          placeholder="내 주변 혜택 가맹점"
          class="border-0 px-0 shadow-none focus-visible:ring-0"
          @focus="closeSheet"
        />
      </div>

      <div ref="controlsRef" class="flex gap-2">
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

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-y-full"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="selectedMerchant"
        ref="sheetRef"
        class="bg-card absolute inset-x-0 bottom-0 z-20 max-h-4/5 overflow-y-auto rounded-t-2xl p-5"
      >
        <MerchantBottomSheet :merchant="selectedMerchant" @close="closeSheet" />
      </div>
    </Transition>
  </div>
</template>
