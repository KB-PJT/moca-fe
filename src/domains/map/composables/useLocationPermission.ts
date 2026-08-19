import { onActivated, onDeactivated, onUnmounted, ref, watch, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchMyPageSummary, updateLocationPermissionGranted } from '@/domains/mypage/api/mypage'
import { requestCurrentPosition, type Coordinates } from '@/domains/map/composables/currentLocation'

const LOCATION_MODAL_DISMISSED_KEY = 'map:locationModalDismissed'

export function useLocationPermission(isMapReady: Ref<boolean>) {
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

  // 위치가 한 번 확보되면 그 뒤로는 1회성 조회 대신 watchPosition으로 계속 갱신해서
  // 지도 위 "내 위치" 마커가 네이버지도처럼 실시간으로 움직이게 한다. 화면을 나가면(onUnmounted) 해제.
  let watchId: number | null = null

  function startWatchingPosition() {
    if (watchId !== null || !navigator.geolocation) return

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        currentLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 },
    )
  }

  function pauseWatchingPosition() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  function clearWatch() {
    pauseWatchingPosition()
    currentLocation.value = null
  }

  // KeepAlive로 지도 탭이 살아있는 상태로 다른 탭에 가있는 동안에도 GPS watch가 백그라운드에서
  // 계속 돌면 배터리를 불필요하게 쓰므로, 탭을 벗어나면(deactivated) 잠깐 멈추고 다시
  // 돌아오면(activated) 이어서 추적한다. currentLocation은 유지해서 재진입 시 로딩이 안 보이게 한다.
  let wasWatchingBeforeDeactivate = false

  onDeactivated(() => {
    wasWatchingBeforeDeactivate = watchId !== null
    pauseWatchingPosition()
  })

  onActivated(() => {
    if (wasWatchingBeforeDeactivate) {
      wasWatchingBeforeDeactivate = false
      startWatchingPosition()
    }
  })

  onUnmounted(() => {
    clearWatch()
  })

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
    try {
      await updateLocationPermission(true)
      startWatchingPosition()
      isLocationModalOpen.value = false
    } catch {
      clearWatch()
      locationPermissionError.value = '위치 추천 설정을 저장하지 못했어요.'
    } finally {
      isRequestingLocation.value = false
    }
  }

  function handleLaterLocation() {
    sessionStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, '1')
    isLocationModalOpen.value = false
  }

  watch(
    () => [isMapReady.value, myPageSummary.value] as const,
    async ([ready, summary]) => {
      if (!ready || !summary) return

      if (summary.locationRecommendationEnabled) {
        currentLocation.value = await requestCurrentPosition()
        if (myPageSummary.value?.locationRecommendationEnabled && currentLocation.value) {
          startWatchingPosition()
        } else if (!myPageSummary.value?.locationRecommendationEnabled) {
          clearWatch()
        }
        isLocationCheckComplete.value = true
        return
      }

      clearWatch()
      isLocationCheckComplete.value = true
      if (sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY)) return
      isLocationModalOpen.value = true
    },
    { immediate: true },
  )

  return {
    currentLocation,
    isLocationModalOpen,
    isRequestingLocation,
    locationPermissionError,
    isLocationCheckComplete,
    handleAllowLocation,
    handleLaterLocation,
  }
}
