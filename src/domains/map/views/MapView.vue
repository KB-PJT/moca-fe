<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  ChevronDown,
  Info,
  List,
  LoaderCircle,
  LocateFixed,
  Map as MapIcon,
  RefreshCw,
} from '@lucide/vue'
import {
  fetchMerchantCategories,
  fetchMerchantsByCategory,
  fetchNearbyMerchants,
  toMerchant,
} from '@/domains/map/api/merchants'
import { sortByCategoryOrder } from '@/domains/map/utils/categoryIcon'
import { distanceMeters, type Coordinates } from '@/domains/map/composables/currentLocation'
import { useKakaoMap } from '@/domains/map/composables/useKakaoMap'
import { useLocationPermission } from '@/domains/map/composables/useLocationPermission'
import { useMerchantSheet } from '@/domains/map/composables/useMerchantSheet'
import CategoryPickerSheet from '@/domains/map/components/CategoryPickerSheet.vue'
import LocationPermissionModal from '@/domains/map/components/LocationPermissionModal.vue'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'
import PlaceListPanel from '@/domains/map/components/PlaceListPanel.vue'

const mapContainer = ref<HTMLElement | null>(null)
const controlsRef = ref<HTMLElement | null>(null)
const sheetRef = ref<HTMLElement | null>(null)

const viewMode = ref<'map' | 'list'>('map')

// GPS로 얻은 currentLocation과 별개로, 가맹점 조회 기준이 되는 좌표.
// 지도를 드래그해서 벗어나면 "현 지도에서 검색"을 누르기 전까진 GPS 위치를 따라가지 않는다.
const searchCenter = ref<Coordinates | null>(null)
const isMapMoved = ref(false)
const MOVE_THRESHOLD_METERS = 150
const SEARCH_RADIUS_METERS = 500

let onBackgroundClick = () => {}
const kakaoMap = useKakaoMap(mapContainer, controlsRef, sheetRef, {
  onMapClick: () => onBackgroundClick(),
  onDragEnd: (coordinates) => {
    if (!searchCenter.value) return
    isMapMoved.value = distanceMeters(searchCenter.value, coordinates) > MOVE_THRESHOLD_METERS
  },
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

watch(
  currentLocation,
  (coordinates) => {
    if (coordinates && !searchCenter.value) searchCenter.value = coordinates
  },
  { immediate: true },
)

function searchCurrentMapArea() {
  const center = kakaoMap.getCenter()
  if (!center) return
  searchCenter.value = center
  isMapMoved.value = false
}

watch(
  () => [searchCenter.value, isMapReady.value] as const,
  ([center, ready]) => {
    if (!center || !ready) return
    kakaoMap.renderSearchRadiusCircle(center, SEARCH_RADIUS_METERS)
  },
)

const {
  data: categories,
  isPending: isCategoriesPending,
  isError: isCategoriesError,
  refetch: refetchCategories,
} = useQuery({
  queryKey: ['merchants', 'categories'],
  queryFn: fetchMerchantCategories,
})

const activeCategoryId = ref<string | null>(null)
const activeMerchantId = ref<string | null>(null)
const isCategoryPickerOpen = ref(false)

const orderedCategories = computed(() => sortByCategoryOrder(categories.value ?? []))

watch(
  orderedCategories,
  (list) => {
    if (list.length && !activeCategoryId.value) {
      activeCategoryId.value = list[0]!.categoryId
    }
  },
  { immediate: true },
)

const activeCategoryName = computed(
  () =>
    categories.value?.find((category) => category.categoryId === activeCategoryId.value)
      ?.categoryName ?? '',
)

function openCategoryPicker() {
  onSheetClose()
  isCategoryPickerOpen.value = true
}

function recenterToCurrentLocation() {
  if (!currentLocation.value) return
  kakaoMap.recenterTo(currentLocation.value)
  searchCenter.value = currentLocation.value
  isMapMoved.value = false
}

function selectCategory(categoryId: string) {
  activeCategoryId.value = categoryId
  activeMerchantId.value = null
}

function toggleBrandFilter(merchantId: string) {
  activeMerchantId.value = activeMerchantId.value === merchantId ? null : merchantId
}

const {
  data: merchantBrands,
  isPending: isBrandsPending,
  isError: isBrandsError,
  refetch: refetchBrands,
} = useQuery({
  queryKey: ['merchants', 'brands', activeCategoryId],
  queryFn: () => fetchMerchantsByCategory(activeCategoryId.value!),
  enabled: computed(() => Boolean(activeCategoryId.value)),
})

const {
  data: nearbyMerchants,
  isFetching: isNearbyFetching,
  isSuccess: isNearbySuccess,
  isError: isNearbyError,
  refetch: refetchNearby,
} = useQuery({
  queryKey: ['merchants', 'nearby', activeCategoryId, activeMerchantId, searchCenter],
  queryFn: () =>
    fetchNearbyMerchants({
      categoryId: activeCategoryId.value!,
      merchantId: activeMerchantId.value ?? undefined,
      latitude: searchCenter.value!.latitude,
      longitude: searchCenter.value!.longitude,
      radiusMeters: SEARCH_RADIUS_METERS,
    }),
  enabled: computed(() => Boolean(activeCategoryId.value && searchCenter.value)),
})

const filteredMerchants = computed(
  () => nearbyMerchants.value?.map((item) => toMerchant(item, activeCategoryName.value)) ?? [],
)

const isNoMerchantsToastVisible = ref(false)
let noMerchantsToastTimer: ReturnType<typeof setTimeout> | undefined

watch([nearbyMerchants, isNearbyFetching, isNearbySuccess], ([list, fetching, success]) => {
  if (noMerchantsToastTimer) {
    clearTimeout(noMerchantsToastTimer)
    noMerchantsToastTimer = undefined
  }

  const isEmptyResult = success && !fetching && !!list && list.length === 0
  isNoMerchantsToastVisible.value = isEmptyResult

  if (!isEmptyResult) return

  noMerchantsToastTimer = setTimeout(() => {
    isNoMerchantsToastVisible.value = false
  }, 2000)
})

onBeforeUnmount(() => {
  if (noMerchantsToastTimer) clearTimeout(noMerchantsToastTimer)
})

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

function toggleViewMode() {
  if (viewMode.value === 'list') {
    viewMode.value = 'map'
    return
  }
  openListView()
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

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="isNoMerchantsToastVisible"
        role="status"
        class="bg-charcoal absolute inset-x-5 bottom-[max(1rem,var(--safe-area-bottom))] z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-white shadow-lg"
      >
        <Info class="size-4 shrink-0 text-white/70" />
        <p class="flex-1 text-caption">탐색 범위 내에 가맹점이 없어요.</p>
        <button
          type="button"
          class="text-primary shrink-0 text-caption font-semibold"
          @click="isNoMerchantsToastVisible = false"
        >
          닫기
        </button>
      </div>
    </Transition>

    <div
      class="pointer-events-none absolute inset-0 z-10 flex flex-col"
      :class="
        viewMode === 'list' ? 'bg-card' : (!isScreenReady || isCategoriesPending) && 'bg-screen'
      "
    >
      <div
        class="pointer-events-auto flex items-center gap-2 border-b border-divider bg-card px-4 py-3"
      >
        <button
          v-if="currentLocation"
          type="button"
          aria-label="내 위치로 이동"
          class="text-gray shrink-0"
          @click="recenterToCurrentLocation"
        >
          <LocateFixed class="size-5" />
        </button>
        <span v-else class="size-5 shrink-0" aria-hidden="true" />

        <div class="flex flex-1 justify-center">
          <button
            v-if="activeCategoryId"
            type="button"
            class="flex items-center gap-1 py-1"
            @click="openCategoryPicker"
          >
            <span class="text-body font-semibold text-charcoal">{{ activeCategoryName }}</span>
            <ChevronDown class="text-gray size-4" />
          </button>
        </div>

        <button
          v-if="isScreenReady"
          type="button"
          class="text-caption bg-primary flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-white"
          @click="toggleViewMode"
        >
          <component :is="viewMode === 'map' ? List : MapIcon" class="size-4" />
          {{ viewMode === 'map' ? '목록' : '지도' }}
        </button>
      </div>

      <div
        v-if="
          !isScreenReady ||
          isCategoriesPending ||
          isCategoriesError ||
          (categories && categories.length === 0)
        "
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
        <template v-else-if="isScreenReady && isCategoriesError">
          <p class="text-caption text-gray">카테고리를 불러오지 못했어요.</p>
          <button
            type="button"
            class="text-caption bg-primary rounded-full px-4 py-1.5 text-white"
            @click="() => refetchCategories()"
          >
            다시 시도
          </button>
        </template>
        <template v-else-if="isScreenReady && categories && categories.length === 0">
          <p class="text-caption text-gray">표시할 카테고리가 없어요.</p>
          <button
            type="button"
            class="text-caption bg-primary rounded-full px-4 py-1.5 text-white"
            @click="() => refetchCategories()"
          >
            다시 시도
          </button>
        </template>
        <template v-else>
          <LoaderCircle class="text-primary size-6 animate-spin" />
          <p class="text-caption text-gray">
            {{ isScreenReady ? '카테고리를 불러오는 중...' : '지도를 불러오는 중...' }}
          </p>
        </template>
      </div>

      <template v-else>
        <div ref="controlsRef" class="pointer-events-auto space-y-3 p-4 pt-3">
          <div v-if="isBrandsPending" class="flex items-center gap-2 py-1.5">
            <LoaderCircle class="text-primary size-4 animate-spin" />
            <span class="text-caption text-gray">브랜드를 불러오는 중...</span>
          </div>
          <div
            v-else-if="isBrandsError"
            class="shadow-float flex items-center justify-between gap-2 rounded-md bg-card px-3 py-2"
          >
            <p class="text-caption text-gray">브랜드 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              class="text-caption text-primary font-semibold"
              @click="() => refetchBrands()"
            >
              다시 시도
            </button>
          </div>
          <p v-else-if="(merchantBrands?.length ?? 0) === 0" class="text-caption text-gray">
            이 카테고리엔 등록된 브랜드가 없어요.
          </p>
          <div v-else class="scrollbar-hide flex gap-2 overflow-x-auto">
            <button
              v-for="brand in merchantBrands"
              :key="brand.merchantId"
              type="button"
              class="text-caption shrink-0 rounded-full border px-3 py-1.5 whitespace-nowrap"
              :class="
                activeMerchantId === brand.merchantId
                  ? 'border-primary bg-primary text-white'
                  : 'border-divider bg-card text-charcoal'
              "
              :aria-pressed="activeMerchantId === brand.merchantId"
              @click="toggleBrandFilter(brand.merchantId)"
            >
              {{ brand.name }}
            </button>
          </div>

          <div
            v-if="isNearbyError"
            class="shadow-float flex items-center justify-between gap-2 rounded-md bg-card px-3 py-2"
          >
            <p class="text-caption text-gray">가맹점 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              class="text-caption text-primary font-semibold"
              @click="() => refetchNearby()"
            >
              다시 시도
            </button>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="-translate-y-1 opacity-0"
          leave-active-class="transition duration-100 ease-in"
          leave-to-class="-translate-y-1 opacity-0"
        >
          <div
            v-if="isMapMoved && viewMode === 'map'"
            class="pointer-events-none flex justify-center px-4 pt-1"
          >
            <button
              type="button"
              class="bg-charcoal pointer-events-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-caption font-semibold text-white shadow-lg"
              @click="searchCurrentMapArea"
            >
              <RefreshCw class="size-3.5" />
              현 지도에서 검색
            </button>
          </div>
        </Transition>

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

    <CategoryPickerSheet
      v-model:open="isCategoryPickerOpen"
      :categories="orderedCategories"
      :active-category-id="activeCategoryId"
      @select="selectCategory"
    />
  </div>
</template>
