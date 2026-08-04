<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { List, LoaderCircle, Map as MapIcon, Search } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { merchants, type Merchant } from '@/domains/map/api/merchants.mock'
import { dotMarkerImage, pinMarkerImage } from '@/domains/map/composables/markerIcon'
import { useSheetTransition } from '@/domains/map/composables/useSheetTransition'
import MerchantBottomSheet from '@/domains/map/components/MerchantBottomSheet.vue'
import PlaceListPanel from '@/domains/map/components/PlaceListPanel.vue'

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
// 카카오맵 SDK 로딩이 끝나기 전엔 markerByPlaceId가 비어있어서 마커 클릭도, 목록에서 상세로
// 들어가는 것도 조용히 실패한다. 로딩이 끝날 때까지 검색바를 뺀 나머지 조작을 막는다.
const isMapReady = ref(false)
const mapLoadError = ref(false)

// 마커 렌더링과 목록 화면이 같은 카테고리 필터를 공유한다.
const filteredMerchants = computed(() =>
  activeCategory.value === '전체'
    ? merchants
    : merchants.filter((merchant) => merchant.category === activeCategory.value),
)

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

// 목록에서 가맹점을 탭하면 목록 위로 바로 상세 시트를 펼친다. 펼쳐진 시트가 화면 전체를 덮으므로
// viewMode는 그대로 'list'로 둬도 되고, 덕분에 나중에 상세를 닫으면 자연스럽게 다시 목록으로 돌아간다.
async function selectFromList(merchant: Merchant) {
  await selectMerchant(merchant)
  startExpand(merchant)
}

// 시트가 떠 있는 상태에서 목록 버튼을 누르면, 시트가 목록 패널(z-10)보다 위(z-20)에 그대로 남지 않도록 먼저 내린다.
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

// 지금 상태(압축/펼침)와 상관없이 시트가 떠 있으면 애니메이션과 함께 닫는다.
function onSheetClose() {
  if (!selectedMerchant.value) return
  startCollapse()
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
  // selectedMerchant를 반영하는 것과 같은 틱에 세팅해야, 화면 밖에서 시작해서 슬라이드해
  // 들어오는 것처럼 보인다(먼저 자연스러운 위치로 그려졌다가 숨는 깜빡임 방지).
  sheet.startOpen()
  selectedMerchant.value = merchant

  // 시트가 처음 열리는 경우 DOM에 반영될 때까지 기다렸다가 높이를 재야 한다.
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

  const filtered = filteredMerchants.value

  if (selectedMerchant.value && !filtered.includes(selectedMerchant.value)) {
    onSheetClose()
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
  isMapReady.value = true
}

watch(activeCategory, updateMarkers)

// 브라우저 뒤로/앞으로 가기 등으로 라우트만 바뀌는 경우에도 시트 상태를 맞춰준다.
// 상세로 들어오면 시트를 맞추고, 상세를 벗어나면(뒤로가기 등) 라우트는 이미 바뀐 뒤이므로
// router.back()을 또 호출하지 않고 시트만 접는다.
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

// 다시 시도 버튼에서도 재사용할 수 있도록 스크립트 로딩을 함수로 분리.
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
      v-if="viewMode === 'map' && isMapReady"
      class="bg-linear-to-b pointer-events-none absolute inset-x-0 top-0 z-10 h-40 from-black/35 to-transparent"
    />

    <div
      class="pointer-events-none absolute inset-0 z-10 flex flex-col"
      :class="(viewMode === 'list' || !isMapReady) && 'bg-screen'"
    >
      <!-- 로딩 중에도 검색바만은 계속 보이도록 별도 행으로 분리 -->
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

      <!-- 카카오맵 SDK 로딩이 끝나기 전엔 마커가 없어 탭해도 반응이 없으므로,
           검색바를 뺀 나머지(탭·카테고리·목록)를 로딩 화면으로 대체해 조작 자체를 막는다. -->
      <div
        v-if="!isMapReady"
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
  </div>
</template>
