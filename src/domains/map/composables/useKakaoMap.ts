import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import type { Merchant } from '@/domains/map/api/merchants'
import {
  currentLocationMarkerImage,
  dotMarkerImage,
  pinMarkerImage,
} from '@/domains/map/composables/markerIcon'
import type { Coordinates } from '@/domains/map/composables/currentLocation'

interface UseKakaoMapOptions {
  onMapClick: () => void
}

export function useKakaoMap(
  mapContainer: Ref<HTMLElement | null>,
  controlsRef: Ref<HTMLElement | null>,
  sheetRef: Ref<HTMLElement | null>,
  { onMapClick }: UseKakaoMapOptions,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapInstance: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clusterer: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerByPlaceId = new Map<string, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let selectedMarker: any = null
  let selectedPlaceId: string | null = null
  let selectedMerchantCategory: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentLocationMarker: any = null
  let script: HTMLScriptElement | null = null

  const isMapReady = ref(false)
  const mapLoadError = ref(false)

  function renderMarkers(merchants: Merchant[], onMarkerClick: (merchant: Merchant) => void) {
    if (!mapInstance) return

    clusterer?.clear()
    markerByPlaceId.clear()

    const markers = merchants.map((merchant) => {
      // 재렌더링 전에 선택돼 있던 가맹점이면, 새로 만드는 마커도 선택 상태(핀 모양)를 유지한다.
      const isSelected = merchant.placeId === selectedPlaceId
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(merchant.latitude, merchant.longitude),
        image: isSelected ? pinMarkerImage(merchant.category) : dotMarkerImage(merchant.category),
      })

      markerByPlaceId.set(merchant.placeId, marker)
      window.kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(merchant))

      if (isSelected) {
        selectedMarker = marker
        selectedMerchantCategory = merchant.category
      }

      return marker
    })

    clusterer = new window.kakao.maps.MarkerClusterer({
      map: mapInstance,
      markers,
      averageCenter: true,
      minLevel: 5,
    })

    // 선택돼 있던 가맹점이 새 목록에 더 이상 없으면 선택 상태를 함께 정리한다.
    if (selectedPlaceId && !markerByPlaceId.has(selectedPlaceId)) {
      selectedMarker = null
      selectedPlaceId = null
      selectedMerchantCategory = null
    }
  }

  function selectMarker(merchant: Merchant) {
    const marker = markerByPlaceId.get(merchant.placeId)
    if (!marker) return false

    if (selectedMarker && selectedMarker !== marker && selectedMerchantCategory) {
      selectedMarker.setImage(dotMarkerImage(selectedMerchantCategory))
    }

    marker.setImage(pinMarkerImage(merchant.category))
    selectedMarker = marker
    selectedPlaceId = merchant.placeId
    selectedMerchantCategory = merchant.category
    return true
  }

  function clearSelectedMarker() {
    if (!selectedMarker) return
    if (selectedMerchantCategory) {
      selectedMarker.setImage(dotMarkerImage(selectedMerchantCategory))
    }
    selectedMarker = null
    selectedPlaceId = null
    selectedMerchantCategory = null
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

  function recenterTo(coordinates: Coordinates) {
    if (!mapInstance) return
    mapInstance.setCenter(new window.kakao.maps.LatLng(coordinates.latitude, coordinates.longitude))
  }

  function renderCurrentLocationMarker(coordinates: Coordinates) {
    if (!mapInstance) return

    const position = new window.kakao.maps.LatLng(coordinates.latitude, coordinates.longitude)

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

  function initMap() {
    if (!mapContainer.value) return

    const center = new window.kakao.maps.LatLng(37.5481533, 127.0733985)
    mapInstance = new window.kakao.maps.Map(mapContainer.value, { center, level: 4 })

    requestAnimationFrame(() => {
      mapInstance.relayout()
      mapInstance.setCenter(center)
    })

    window.kakao.maps.event.addListener(mapInstance, 'click', onMapClick)

    isMapReady.value = true
  }

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

  return {
    isMapReady,
    mapLoadError,
    loadKakaoMaps,
    renderMarkers,
    selectMarker,
    clearSelectedMarker,
    focusMarker,
    recenterTo,
    renderCurrentLocationMarker,
  }
}
