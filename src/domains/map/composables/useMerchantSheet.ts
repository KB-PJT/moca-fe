import { nextTick, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Merchant } from '@/domains/map/api/merchants'
import { useSheetTransition } from '@/domains/map/composables/useSheetTransition'
import type { useKakaoMap } from '@/domains/map/composables/useKakaoMap'
import { captureEvent } from '@/plugins/posthog'

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
  // 상세(펼침) 상태에서 스크롤 맨 위(러버밴드 포함)까지 당겨서 닫으려는 시도는, 스크롤
  // 관성과 겹쳐 실수로 닫히는 걸 막기 위해 한 번은 "막히기"만 하고, 손을 뗐다가 다시
  // 당기는 별도의 시도에서만 실제로 닫히게 한다.
  let closeArmed = false
  // closeArmed를 지금 이 드래그 안에서 세운 경우, 같은 드래그가 끝나기 전까지는(손가락을
  // 떼기 전까지는) 그 armed 상태를 곧바로 소비해서 닫아버리지 않도록 막는 플래그.
  let armedThisDrag = false
  // 휠/트랙패드는 터치의 touchstart~touchend 같은 명확한 제스처 경계가 없어서, 한 번의
  // "세게 스크롤"이 관성(inertia)으로 수백 ms 동안 wheel 이벤트를 계속 쏟아낸다. 그 상태로
  // 방치하면 전환 애니메이션이 끝나 상태가 바뀐 직후에도 같은 관성 이벤트가 새 상태 기준으로
  // 또 다른 전환(예: 압축 카드 도달 직후 곧바로 완전히 닫기)을 일으켜, 하단 시트를 그냥 지나쳐
  // 끝까지 닫혀버리고 남은 이벤트가 지도로 새어나가 확대까지 되는 문제가 있었다. 휠로 전환을
  // 일으킬 때마다 애니메이션 시간보다 넉넉한 쿨다운 동안 추가 휠 이벤트를 무시해 막는다.
  let wheelCooldownUntil = 0
  const WHEEL_COOLDOWN_MS = 500
  // 한 번의 물리적 드래그(터치 시작~끝)당 시트 전환은 하나만 일어나게 막는 플래그.
  // 예: 상세→압축 전환(shrink)은 320ms가 걸리는데, 그동안 손가락을 계속 누르고 있으면
  // 애니메이션이 끝나 isExpanding이 false로 바뀐 순간 같은 드래그의 누적 delta가 그대로
  // "압축 상태에서 당겨서 완전히 닫기" 조건까지 만족해버려 곧바로 완전히 닫혀버리는 문제가
  // 있었다. 전환이 한 번 일어나면 이 드래그의 나머지 move는 무시하고, 사용자가 손을 뗐다가
  // 다시 시도하는 별도 제스처에서만 다음 동작이 일어나게 한다.
  let gestureConsumed = false
  // returnToSheet()가 router.back()으로 라우트를 뺄 때 placeId watch가 또 반응해서
  // 중복으로 처리하지 않도록 막는 재진입 가드.
  let isReturningToSheet = false

  function isSheetScrollable(): boolean {
    const el = sheetRef.value
    if (!el) return false
    return el.scrollHeight - el.clientHeight > 1
  }

  function startExpand(merchant: Merchant) {
    closeArmed = false
    sheet.expand(() => {
      router.push({ name: 'merchant-detail', params: { placeId: merchant.placeId } })
    })
  }

  function closeSheet() {
    sheet.reset()
    kakaoMap.clearSelectedMarker()
    selectedMerchant.value = null
    closeArmed = false
  }

  function startCollapse() {
    sheet.collapse(() => {
      closeSheet()
      if (route.name === 'merchant-detail') {
        router.back()
      }
    })
  }

  // 상세(펼침)에서 닫는 제스처는 완전히 닫지 않고 압축 카드(하단 시트)로 되돌린다.
  // 압축 카드 높이를 몰라 되돌릴 수 없는 경우(딥링크 진입 등)에만 완전히 닫는다.
  function returnToSheet() {
    if (isReturningToSheet) return
    isReturningToSheet = true

    const didShrink = sheet.shrink(() => {
      closeArmed = false
      isReturningToSheet = false
    })

    if (!didShrink) {
      isReturningToSheet = false
      startCollapse()
      return
    }

    if (route.name === 'merchant-detail') {
      router.back()
    }
  }

  function onSheetClose() {
    if (!selectedMerchant.value) return
    startCollapse()
  }

  async function selectMerchant(merchant: Merchant) {
    if (!kakaoMap.selectMarker(merchant)) return

    captureEvent('merchant_selected', {
      category: merchant.category,
      merchantId: merchant.merchantId,
    })

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
    armedThisDrag = false
    gestureConsumed = false
  }

  const TOGGLE_THRESHOLD = 50
  // 펼쳐진 상세 시트를 "당겨서 닫기"는 스크롤하려는 손짓과 자주 겹치는 제스처라, 실수로
  // 닫히지 않도록 접기/펼치기 토글보다 더 크고 확실한 드래그를 요구한다.
  const CLOSE_THRESHOLD = 120

  function onSheetTouchMove(event: TouchEvent) {
    if (!selectedMerchant.value) return
    if (gestureConsumed) return
    const touch = event.touches[0]
    if (!touch) return
    const delta = touch.clientY - touchStartY
    const scrollTop = sheetRef.value?.scrollTop ?? 0

    // 맨 위를 벗어나 다시 콘텐츠를 스크롤하기 시작했다면, 이전에 "막혔던" 닫기 시도는 잊는다.
    if (scrollTop > 4) closeArmed = false

    if (!sheet.isExpanding.value && delta < -TOGGLE_THRESHOLD) {
      gestureConsumed = true
      startExpand(selectedMerchant.value)
    } else if (!sheet.isExpanding.value && delta > TOGGLE_THRESHOLD) {
      gestureConsumed = true
      startCollapse()
    } else if (
      sheet.isExpanding.value &&
      !sheet.isCollapsing.value &&
      delta > CLOSE_THRESHOLD &&
      scrollTop <= 0
    ) {
      // 콘텐츠가 스크롤된 상태에서 아래로 드래그하면 스크롤 동작으로 봐야 하므로,
      // 맨 위(scrollTop 0, 러버밴드 포함 음수)까지 올라와 있을 때만 "당겨서 닫기"로 인식한다.
      // 다만 스크롤 가능한 콘텐츠라면, 스크롤이 맨 위에 닿은 관성만으로 실수로 닫히지
      // 않도록 첫 시도는 막고, 손을 뗐다가 다시 당기는 시도에서만 실제로 닫히게 한다.
      // 스크롤이 애초에 생기지 않을 만큼 짧은 콘텐츠라면 이 예외 없이 바로 닫는다.
      if (!isSheetScrollable() || (closeArmed && !armedThisDrag)) {
        gestureConsumed = true
        returnToSheet()
        closeArmed = false
      } else if (!armedThisDrag) {
        closeArmed = true
        armedThisDrag = true
      }
    }
  }

  function onSheetWheel(event: WheelEvent) {
    if (!selectedMerchant.value) return
    if (Date.now() < wheelCooldownUntil) return

    if (!sheet.isExpanding.value && event.deltaY > 30) {
      wheelCooldownUntil = Date.now() + WHEEL_COOLDOWN_MS
      startExpand(selectedMerchant.value)
    } else if (!sheet.isExpanding.value && event.deltaY < -30) {
      wheelCooldownUntil = Date.now() + WHEEL_COOLDOWN_MS
      startCollapse()
    } else if (sheet.isExpanding.value && !sheet.isCollapsing.value && event.deltaY < -30) {
      wheelCooldownUntil = Date.now() + WHEEL_COOLDOWN_MS
      returnToSheet()
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
        // returnToSheet()가 이미 이 라우트 변경을 발생시키고 압축 카드로 되돌리는 애니메이션을
        // 처리하고 있는 경우엔, 여기서 다시 완전히 닫아버리지 않도록 건너뛴다.
        if (isReturningToSheet) return
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
