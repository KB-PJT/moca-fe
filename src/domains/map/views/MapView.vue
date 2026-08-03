<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { List, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { merchants, type Merchant } from '@/domains/map/api/merchants.mock'
import { dotMarkerImage, pinMarkerImage } from '@/domains/map/composables/markerIcon'
import { useSheetTransition } from '@/domains/map/composables/useSheetTransition'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'

const route = useRoute()
const router = useRouter()

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

// 시트를 아래로 스크롤/드래그하면 전체 화면으로 커지면서 상세 페이지(URL)로 이동하고,
// 반대로 위로 스크롤/드래그하거나 X를 누르면 원래 크기로 줄어들며 지도 화면으로 돌아간다.
// 지도·상세 라우트가 이 컴포넌트를 그대로 재사용하므로(router/index.ts 참고) 전환 중에도
// 실제 지도가 계속 같은 자리에 떠 있고, 화면이 안 바뀌고 시트만 커지고 작아지는 것처럼 보인다.
// 실제 높이/transform 애니메이션은 지도·라우터를 몰라도 되는 useSheetTransition에 맡긴다.
const sheet = useSheetTransition(sheetRef, mapContainer)
let touchStartY = 0

function startExpand(merchant: Merchant) {
  sheet.expand(() => {
    router.push({ name: 'merchant-detail', params: { placeId: merchant.placeId } })
  })
}

function startCollapse() {
  sheet.collapse(() => {
    closeSheet()
    if (route.name === 'merchant-detail') {
      router.back()
    }
  })
}

function onSheetTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  touchStartY = touch.clientY
}

function onSheetTouchMove(event: TouchEvent) {
  if (!selectedMerchant.value) return
  const touch = event.touches[0]
  if (!touch) return
  const delta = touch.clientY - touchStartY

  if (!sheet.isExpanding.value && delta > 50) {
    startExpand(selectedMerchant.value)
  } else if (sheet.isExpanding.value && !sheet.isCollapsing.value && delta < -50) {
    startCollapse()
  }
}

function onSheetWheel(event: WheelEvent) {
  if (!selectedMerchant.value) return

  if (!sheet.isExpanding.value && event.deltaY > 30) {
    startExpand(selectedMerchant.value)
  } else if (sheet.isExpanding.value && !sheet.isCollapsing.value && event.deltaY < -30) {
    startCollapse()
  }
}

function onSheetClose() {
  if (sheet.isExpanding.value) {
    startCollapse()
  } else {
    closeSheet()
  }
}

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
  sheet.reset()

  // 시트가 처음 열리는 경우 DOM에 반영될 때까지 기다렸다가 높이를 재야 한다.
  await nextTick()
  focusMarker(merchant)
}

function closeSheet() {
  sheet.reset()

  if (selectedMarker) {
    selectedMarker.setImage(dotMarkerImage())
    selectedMarker = null
  }
  selectedMerchant.value = null
}

// URL로 상세 라우트(/map/merchants/:placeId)에 바로 진입한 경우(새로고침, 직접 링크 등)
// 애니메이션 없이 곧바로 전체 화면으로 펼쳐진 상태를 맞춰준다.
function syncSheetWithRoute() {
  if (route.name !== 'merchant-detail' || !mapContainer.value) return
  if (selectedMerchant.value?.placeId === route.params.placeId) return

  const merchant = merchants.find((item) => item.placeId === route.params.placeId)
  if (!merchant) return

  const marker = markerByPlaceId.get(merchant.placeId)
  if (marker) {
    if (selectedMarker && selectedMarker !== marker) {
      selectedMarker.setImage(dotMarkerImage())
    }
    marker.setImage(pinMarkerImage(merchant.category))
    selectedMarker = marker
  }

  selectedMerchant.value = merchant
  sheet.snapExpanded()
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

  // 라우트 전환 직후 등 컨테이너 크기가 아직 확정되기 전에 지도가 생성되면
  // 잘못된 크기로 초기 렌더링됐다가 갑자기 확대/축소된 것처럼 튀어 보인다.
  // 레이아웃이 안정된 다음 프레임에 실제 크기 기준으로 다시 맞춘다.
  requestAnimationFrame(() => {
    mapInstance.relayout()
    mapInstance.setCenter(center)
  })

  window.kakao.maps.event.addListener(mapInstance, 'click', () => {
    if (selectedMerchant.value) onSheetClose()
  })

  updateMarkers()
  syncSheetWithRoute()
}

watch(activeCategory, updateMarkers)

// 브라우저 뒤로/앞으로 가기 등으로 라우트만 바뀌는 경우에도 시트 상태를 맞춰준다.
watch(
  () => route.params.placeId,
  () => {
    if (mapInstance) syncSheetWithRoute()
  },
)

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
        class="bg-card absolute inset-x-0 bottom-0 z-20 overflow-y-auto rounded-t-2xl p-5"
        :class="[
          !sheet.isExpanding.value && 'max-h-4/5',
          sheet.transitionEnabled.value && 'transition-transform duration-300 ease-out',
        ]"
        :style="{
          height: sheet.heightPx.value ?? undefined,
          transform: sheet.transform.value ?? undefined,
        }"
        @touchstart="onSheetTouchStart"
        @touchmove="onSheetTouchMove"
        @wheel="onSheetWheel"
      >
        <MerchantBottomSheet :merchant="selectedMerchant" @close="onSheetClose" />
      </div>
    </Transition>
  </div>
</template>
