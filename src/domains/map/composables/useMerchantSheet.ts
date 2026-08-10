import { nextTick, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Merchant } from '@/domains/map/api/merchants'
import { useSheetTransition } from '@/domains/map/composables/useSheetTransition'
import type { useKakaoMap } from '@/domains/map/composables/useKakaoMap'

export function useMerchantSheet(
  sheetRef: Ref<HTMLElement | null>,
  mapContainer: Ref<HTMLElement | null>,
  filteredMerchants: ComputedRef<Merchant[]>,
  kakaoMap: ReturnType<typeof useKakaoMap>,
) {
  const route = useRoute()
  const router = useRouter()

  const selectedMerchant = ref<Merchant | null>(null)
  const sheet = useSheetTransition(sheetRef, mapContainer)
  let touchStartY = 0

  function startExpand(merchant: Merchant) {
    sheet.expand(() => {
      router.push({ name: 'merchant-detail', params: { placeId: merchant.placeId } })
    })
  }

  function closeSheet() {
    sheet.reset()
    kakaoMap.clearSelectedMarker()
    selectedMerchant.value = null
  }

  function startCollapse() {
    sheet.collapse(() => {
      closeSheet()
      if (route.name === 'merchant-detail') {
        router.back()
      }
    })
  }

  function onSheetClose() {
    if (!selectedMerchant.value) return
    startCollapse()
  }

  async function selectMerchant(merchant: Merchant) {
    if (!kakaoMap.selectMarker(merchant)) return

    sheet.startOpen()
    selectedMerchant.value = merchant

    await nextTick()
    kakaoMap.focusMarker(merchant)
    sheet.settleOpen()
  }

  async function selectFromList(merchant: Merchant) {
    await selectMerchant(merchant)
    startExpand(merchant)
  }

  function onSheetTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    touchStartY = touch.clientY
  }

  const TOGGLE_THRESHOLD = 50
  // 펼쳐진 상세 시트를 "당겨서 닫기"는 스크롤하려는 손짓과 자주 겹치는 제스처라, 실수로
  // 닫히지 않도록 접기/펼치기 토글보다 더 크고 확실한 드래그를 요구한다.
  const CLOSE_THRESHOLD = 120

  function onSheetTouchMove(event: TouchEvent) {
    if (!selectedMerchant.value) return
    const touch = event.touches[0]
    if (!touch) return
    const delta = touch.clientY - touchStartY

    if (!sheet.isExpanding.value && delta < -TOGGLE_THRESHOLD) {
      startExpand(selectedMerchant.value)
    } else if (!sheet.isExpanding.value && delta > TOGGLE_THRESHOLD) {
      startCollapse()
    } else if (
      sheet.isExpanding.value &&
      !sheet.isCollapsing.value &&
      delta > CLOSE_THRESHOLD &&
      (sheetRef.value?.scrollTop ?? 0) <= 0
    ) {
      // 콘텐츠가 스크롤된 상태에서 아래로 드래그하면 스크롤 동작으로 봐야 하므로,
      // 맨 위(scrollTop 0)까지 올라와 있을 때만 "당겨서 닫기"로 인식한다.
      startCollapse()
    }
  }

  function onSheetWheel(event: WheelEvent) {
    if (!selectedMerchant.value) return

    if (!sheet.isExpanding.value && event.deltaY > 30) {
      startExpand(selectedMerchant.value)
    } else if (!sheet.isExpanding.value && event.deltaY < -30) {
      startCollapse()
    } else if (sheet.isExpanding.value && !sheet.isCollapsing.value && event.deltaY < -30) {
      startCollapse()
    }
  }

  function syncSheetWithRoute() {
    if (route.name !== 'merchant-detail' || !mapContainer.value) return
    if (selectedMerchant.value?.placeId === route.params.placeId) return

    const merchant = filteredMerchants.value.find((item) => item.placeId === route.params.placeId)
    if (!merchant) return

    kakaoMap.selectMarker(merchant)
    selectedMerchant.value = merchant
    sheet.snapExpanded()
  }

  watch(
    () => [kakaoMap.isMapReady.value, filteredMerchants.value] as const,
    ([ready, list]) => {
      if (!ready) return

      if (selectedMerchant.value) {
        const stillVisible = list.find((item) => item.placeId === selectedMerchant.value!.placeId)
        if (stillVisible) {
          selectedMerchant.value = stillVisible
        } else {
          onSheetClose()
        }
      }

      kakaoMap.renderMarkers(list, selectMerchant)
      syncSheetWithRoute()
    },
    { immediate: true },
  )

  watch(
    () => route.params.placeId,
    () => {
      if (!kakaoMap.isMapReady.value) return

      if (route.name === 'merchant-detail') {
        syncSheetWithRoute()
      } else if (selectedMerchant.value) {
        sheet.collapse(() => closeSheet())
      }
    },
  )

  return {
    sheet,
    selectedMerchant,
    selectMerchant,
    selectFromList,
    onSheetClose,
    onSheetTouchStart,
    onSheetTouchMove,
    onSheetWheel,
  }
}
