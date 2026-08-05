import { ref, watch, type Ref } from 'vue'
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
