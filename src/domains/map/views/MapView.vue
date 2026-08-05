<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { List, LoaderCircle, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { merchants } from '@/domains/map/api/merchants.mock'
import { useKakaoMap } from '@/domains/map/composables/useKakaoMap'
import { useLocationPermission } from '@/domains/map/composables/useLocationPermission'
import { useMerchantSheet } from '@/domains/map/composables/useMerchantSheet'
import { calculateDistanceMeters } from '@/domains/map/utils/distance'
import LocationPermissionModal from '@/domains/map/components/LocationPermissionModal.vue'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'
import PlaceListPanel from '@/domains/map/components/PlaceListPanel.vue'

const mapContainer = ref<HTMLElement | null>(null)
const controlsRef = ref<HTMLElement | null>(null)
const sheetRef = ref<HTMLElement | null>(null)

const categories = ['전체', '음식점', '카페', '편의점', '마트']
const activeCategory = ref('전체')
const viewMode = ref<'map' | 'list'>('map')

let onBackgroundClick = () => {}
const kakaoMap = useKakaoMap(mapContainer, controlsRef, sheetRef, {
  onMapClick: () => onBackgroundClick(),
})
const { isMapReady, mapLoadError, loadKakaoMaps } = kakaoMap

const {
  currentLocation,
  isLocationModalOpen,
  isRequestingLocation,
  locationPermissionError,
  isLocationCheckComplete,
  handleAllowLocation,
  handleLaterLocation,
} = useLocationPermission(isMapReady)

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

const {
  sheet,
  selectedMerchant,
  selectFromList,
  onSheetClose,
  onSheetTouchStart,
  onSheetTouchMove,
  onSheetWheel,
} = useMerchantSheet(sheetRef, mapContainer, filteredMerchants, kakaoMap)

onBackgroundClick = onSheetClose

const isScreenReady = computed(() => isMapReady.value && isLocationCheckComplete.value)

function openListView() {
  onSheetClose()
  viewMode.value = 'list'
}

watch(currentLocation, (coordinates) => {
  if (!coordinates) return
  kakaoMap.recenterTo(coordinates)
  kakaoMap.renderCurrentLocationMarker(coordinates)
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
