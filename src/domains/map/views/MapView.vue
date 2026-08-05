<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { List, LoaderCircle, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { fetchMyPageSummary, updateLocationPermissionGranted } from '@/domains/mypage/api/mypage'
import { merchants, type Merchant } from '@/domains/map/api/merchants.mock'
import {
  currentLocationMarkerImage,
  dotMarkerImage,
  pinMarkerImage,
} from '@/domains/map/composables/markerIcon'
import { requestCurrentPosition, type Coordinates } from '@/domains/map/composables/currentLocation'
import { useSheetTransition } from '@/domains/map/composables/useSheetTransition'
import { calculateDistanceMeters } from '@/domains/map/utils/distance'
import LocationPermissionModal from '@/domains/map/components/LocationPermissionModal.vue'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'
import PlaceListPanel from '@/domains/map/components/PlaceListPanel.vue'

const LOCATION_MODAL_DISMISSED_KEY = 'map:locationModalDismissed'

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let currentLocationMarker: any = null
const mapContainer = ref<HTMLElement | null>(null)
const controlsRef = ref<HTMLElement | null>(null)
const sheetRef = ref<HTMLElement | null>(null)
let script: HTMLScriptElement | null = null

const categories = ['전체', '음식점', '카페', '편의점', '마트']
const activeCategory = ref('전체')
const viewMode = ref<'map' | 'list'>('map')
const selectedMerchant = ref<Merchant | null>(null)
const isMapReady = ref(false)
const mapLoadError = ref(false)

const queryClient = useQueryClient()
const { data: myPageSummary } = useQuery({
  queryKey: ['mypage', 'summary'],
  queryFn: fetchMyPageSummary,
})
const { mutateAsync: updateLocationPermission } = useMutation({
  mutationFn: updateLocationPermissionGranted,
  onSuccess: (updatedSummary) => {
    queryClient.setQueryData(['mypage', 'summary'], updatedSummary)
  },
})

const currentLocation = ref<Coordinates | null>(null)
const isLocationModalOpen = ref(false)
const isRequestingLocation = ref(false)
const locationPermissionError = ref('')
const isLocationCheckComplete = ref(false)
const isScreenReady = computed(() => isMapReady.value && isLocationCheckComplete.value)

const merchantsWithDistance = computed(() => {
  if (!currentLocation.value) return merchants

  return merchants.map((merchant) => ({
    ...merchant,
    distance: calculateDistanceMeters(currentLocation.value!, {
      latitude: merchant.latitude,
      longitude: merchant.longitude,
    }),
  }))
})

const filteredMerchants = computed(() =>
  activeCategory.value === '전체'
    ? merchantsWithDistance.value
    : merchantsWithDistance.value.filter((merchant) => merchant.category === activeCategory.value),
)

const sheet = useSheetTransition(sheetRef, mapContainer)
let touchStartY = 0

function startExpand(merchant: Merchant) {
  sheet.expand(() => {
    router.push({ name: 'merchant-detail', params: { placeId: merchant.placeId } })
  })
}

async function selectFromList(merchant: Merchant) {
  await selectMerchant(merchant)
  startExpand(merchant)
}

function openListView() {
  onSheetClose()
  viewMode.value = 'list'
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
  if (!selectedMerchant.value) return
  startCollapse()
}

function focusMarker(merchant: Merchant) {
  if (!mapInstance || !mapContainer.value || !controlsRef.value || !sheetRef.value) return

  const mapRect = mapContainer.value.getBoundingClientRect()
  const controlsRect = controlsRef.value.getBoundingClientRect()
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
  sheet.startOpen()
  selectedMerchant.value = merchant

  await nextTick()
  focusMarker(merchant)
  sheet.settleOpen()
}

function closeSheet() {
  sheet.reset()

  if (selectedMarker) {
    selectedMarker.setImage(dotMarkerImage())
    selectedMarker = null
  }
  selectedMerchant.value = null
}

function syncSheetWithRoute() {
  if (route.name !== 'merchant-detail' || !mapContainer.value) return
  if (selectedMerchant.value?.placeId === route.params.placeId) return

  const merchant = merchantsWithDistance.value.find((item) => item.placeId === route.params.placeId)
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

  const filtered = filteredMerchants.value

  if (selectedMerchant.value) {
    const stillVisible = filtered.find((item) => item.placeId === selectedMerchant.value!.placeId)
    if (stillVisible) {
      selectedMerchant.value = stillVisible
    } else {
      onSheetClose()
    }
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

  requestAnimationFrame(() => {
    mapInstance.relayout()
    mapInstance.setCenter(center)
  })

  window.kakao.maps.event.addListener(mapInstance, 'click', () => {
    if (selectedMerchant.value) onSheetClose()
  })

  updateMarkers()
  syncSheetWithRoute()
  isMapReady.value = true
}

function renderCurrentLocationMarker() {
  if (!mapInstance || !currentLocation.value) return

  const position = new window.kakao.maps.LatLng(
    currentLocation.value.latitude,
    currentLocation.value.longitude,
  )

  if (currentLocationMarker) {
    currentLocationMarker.setPosition(position)
    return
  }

  currentLocationMarker = new window.kakao.maps.Marker({
    position,
    image: currentLocationMarkerImage(),
    zIndex: 10,
  })
  currentLocationMarker.setMap(mapInstance)
}

async function handleAllowLocation() {
  locationPermissionError.value = ''
  isRequestingLocation.value = true

  const coordinates = await requestCurrentPosition()

  if (!coordinates) {
    locationPermissionError.value = '브라우저 설정에서 위치 권한을 허용해주세요.'
    isRequestingLocation.value = false
    return
  }

  currentLocation.value = coordinates
  await updateLocationPermission(true)
  isRequestingLocation.value = false
  isLocationModalOpen.value = false
}

function handleLaterLocation() {
  sessionStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, '1')
  isLocationModalOpen.value = false
}

watch(currentLocation, (coordinates) => {
  if (!coordinates) return

  if (mapInstance) {
    mapInstance.setCenter(new window.kakao.maps.LatLng(coordinates.latitude, coordinates.longitude))
    updateMarkers()
  }

  renderCurrentLocationMarker()
})

watch(
  () => [isMapReady.value, myPageSummary.value] as const,
  async ([ready, summary]) => {
    if (!ready || !summary) return

    if (summary.locationPermissionGranted) {
      currentLocation.value = await requestCurrentPosition()
      isLocationCheckComplete.value = true
      return
    }

    isLocationCheckComplete.value = true
    if (sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY)) return
    isLocationModalOpen.value = true
  },
  { immediate: true },
)

watch(activeCategory, updateMarkers)

watch(
  () => route.params.placeId,
  () => {
    if (!mapInstance) return

    if (route.name === 'merchant-detail') {
      syncSheetWithRoute()
    } else if (selectedMerchant.value) {
      sheet.collapse(() => closeSheet())
    }
  },
)

function loadKakaoMaps() {
  mapLoadError.value = false

  if (window.kakao?.maps) {
    window.kakao.maps.load(initMap)
    return
  }

  script = document.createElement('script')
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`
  script.onload = () => window.kakao.maps.load(initMap)
  script.onerror = () => {
    mapLoadError.value = true
    script?.remove()
    script = null
  }
  document.head.appendChild(script)
}

onMounted(loadKakaoMaps)

onUnmounted(() => {
  script?.remove()
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div ref="mapContainer" class="h-full w-full" />

    <div
      v-if="viewMode === 'map' && isScreenReady"
      class="bg-linear-to-b pointer-events-none absolute inset-x-0 top-0 z-10 h-40 from-black/35 to-transparent"
    />

    <div
      class="pointer-events-none absolute inset-0 z-10 flex flex-col"
      :class="(viewMode === 'list' || !isScreenReady) && 'bg-screen'"
    >
      <div class="pointer-events-auto p-4 pb-0">
        <div class="bg-card shadow-float flex items-center gap-2 rounded-md px-3">
          <Search class="text-gray size-4 shrink-0" />
          <Input
            placeholder="내 주변 혜택 가맹점"
            class="border-0 px-0 shadow-none focus-visible:ring-0"
            @focus="onSheetClose"
          />
        </div>
      </div>

      <div
        v-if="!isScreenReady"
        class="pointer-events-auto flex flex-1 flex-col items-center justify-center gap-2"
      >
        <template v-if="mapLoadError">
          <p class="text-caption text-gray">지도를 불러오지 못했어요.</p>
          <button
            type="button"
            class="text-caption bg-primary rounded-full px-4 py-1.5 text-white"
            @click="loadKakaoMaps"
          >
            다시 시도
          </button>
        </template>
        <template v-else>
          <LoaderCircle class="text-primary size-6 animate-spin" />
          <p class="text-caption text-gray">지도를 불러오는 중...</p>
        </template>
      </div>

      <template v-else>
        <div class="pointer-events-auto space-y-3 p-4 pt-3">
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
                @click="openListView"
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
                :class="
                  activeCategory === category ? 'bg-primary text-white' : 'bg-card text-charcoal'
                "
                @click="activeCategory = category"
              >
                {{ category }}
              </button>
            </div>
          </div>
        </div>

        <PlaceListPanel
          v-if="viewMode === 'list'"
          class="pointer-events-auto min-h-0 flex-1"
          :merchants="filteredMerchants"
          @select="selectFromList"
        />
      </template>
    </div>

    <div
      v-if="selectedMerchant"
      ref="sheetRef"
      class="bg-card scrollbar-hide absolute inset-x-0 bottom-0 z-20 overflow-y-auto rounded-t-2xl p-5 [transition:transform_300ms_ease-out]"
      :class="!sheet.isExpanding.value && 'max-h-4/5'"
      :style="{
        height: sheet.heightPx.value ?? undefined,
        transform: sheet.transform.value ?? undefined,
        transition: sheet.suppressTransition.value ? 'none' : undefined,
      }"
      @touchstart="onSheetTouchStart"
      @touchmove="onSheetTouchMove"
      @wheel="onSheetWheel"
    >
      <MerchantBottomSheet :merchant="selectedMerchant" :expanded="sheet.isExpanding.value" />
    </div>

    <LocationPermissionModal
      :open="isLocationModalOpen"
      :loading="isRequestingLocation"
      :error="locationPermissionError"
      @update:open="isLocationModalOpen = $event"
      @allow="handleAllowLocation"
      @later="handleLaterLocation"
    />
  </div>
</template>
