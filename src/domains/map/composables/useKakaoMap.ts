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
  // 사용자가 지도를 드래그해서 손을 뗀 시점에만 호출된다. panTo()로 프로그램이
  // 지도를 옮기는 경우(마커 포커싱, recenterTo 등)에는 dragend가 발생하지 않는다.
  onDragEnd?: (coordinates: Coordinates) => void
}

export function useKakaoMap(
  mapContainer: Ref<HTMLElement | null>,
  controlsRef: Ref<HTMLElement | null>,
  sheetRef: Ref<HTMLElement | null>,
  { onMapClick, onDragEnd }: UseKakaoMapOptions,
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
  let selectedMerchantBrandName: string | undefined = undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentLocationMarker: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let searchRadiusCircle: any = null
  let script: HTMLScriptElement | null = null

  const isMapReady = ref(false)
  // isMapReady는 지도 객체가 생성된 시점(타일이 아직 안 그려짐)에 true가 되므로,
  // 로딩 오버레이를 너무 일찍 걷어버려 빈 지도 위에 타일이 하나씩 그려지는 게 보인다.
  // idle 이벤트(패닝/줌/타일 로딩이 가라앉은 시점)까지는 오버레이를 유지하기 위한 별도 상태.
  const isMapVisuallyReady = ref(false)
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
        image: isSelected
          ? pinMarkerImage(merchant.category, merchant.brandName)
          : dotMarkerImage(merchant.category, merchant.brandName),
      })

      markerByPlaceId.set(merchant.placeId, marker)
      window.kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(merchant))

      if (isSelected) {
        selectedMarker = marker
        selectedMerchantCategory = merchant.category
        selectedMerchantBrandName = merchant.brandName
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
      selectedMarker.setImage(dotMarkerImage(selectedMerchantCategory, selectedMerchantBrandName))
    }

    marker.setImage(pinMarkerImage(merchant.category, merchant.brandName))
    selectedMarker = marker
    selectedPlaceId = merchant.placeId
    selectedMerchantCategory = merchant.category
    selectedMerchantBrandName = merchant.brandName
    return true
  }

  function clearSelectedMarker() {
    if (!selectedMarker) return
    if (selectedMerchantCategory) {
      selectedMarker.setImage(dotMarkerImage(selectedMerchantCategory, selectedMerchantBrandName))
    }
    selectedMarker = null
    selectedPlaceId = null
    selectedMerchantCategory = null
    selectedMerchantBrandName = undefined
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

  function getCenter(): Coordinates | null {
    if (!mapInstance) return null
    const center = mapInstance.getCenter()
    return { latitude: center.getLat(), longitude: center.getLng() }
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

  function renderSearchRadiusCircle(coordinates: Coordinates, radiusMeters: number) {
    if (!mapInstance) return

    const position = new window.kakao.maps.LatLng(coordinates.latitude, coordinates.longitude)

    if (searchRadiusCircle) {
      searchRadiusCircle.setPosition(position)
      searchRadiusCircle.setRadius(radiusMeters)
      return
    }

    searchRadiusCircle = new window.kakao.maps.Circle({
      center: position,
      radius: radiusMeters,
      strokeWeight: 1,
      strokeColor: '#ef4444',
      strokeOpacity: 0.4,
      strokeStyle: 'solid',
      fillColor: '#ef4444',
      fillOpacity: 0.12,
    })
    searchRadiusCircle.setMap(mapInstance)
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
    // 최초 idle(패닝/줌/타일 로딩이 가라앉음)에서 한 번만 시각적으로 준비됐다고 표시한다.
    // idle은 이후에도 반복 발생하지만, 이미 true인 값을 다시 true로 두는 건 무해하다.
    window.kakao.maps.event.addListener(mapInstance, 'idle', () => {
      isMapVisuallyReady.value = true
    })

    if (onDragEnd) {
      window.kakao.maps.event.addListener(mapInstance, 'dragend', () => {
        const newCenter = getCenter()
        if (newCenter) onDragEnd(newCenter)
      })
    }

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
    isMapVisuallyReady,
    mapLoadError,
    loadKakaoMaps,
    renderMarkers,
    selectMarker,
    clearSelectedMarker,
    focusMarker,
    recenterTo,
    getCenter,
    renderCurrentLocationMarker,
    renderSearchRadiusCircle,
  }
}
