import { nextTick, ref, type Ref } from 'vue'

// 시트를 "압축된 카드" 높이에서 컨테이너 전체 높이로 부드럽게 확장/축소하는 순수 DOM 애니메이션.
// 무엇을 확장하는지(어떤 가맹점인지), 확장이 끝나면 어디로 갈지는 몰라도 되므로 onDone 콜백으로 위임한다.
export function useSheetTransition(
  sheetRef: Ref<HTMLElement | null>,
  containerRef: Ref<HTMLElement | null>,
) {
  const isExpanding = ref(false)
  const isCollapsing = ref(false)
  const heightPx = ref<string | null>(null)
  const transform = ref<string | null>(null)
  const transitionEnabled = ref(false)

  function reset() {
    isExpanding.value = false
    isCollapsing.value = false
    transitionEnabled.value = false
    heightPx.value = null
    transform.value = null
  }

  // URL로 상세 라우트에 바로 진입했을 때처럼, 애니메이션 없이 곧바로 펼쳐진 상태로 맞춘다.
  function snapExpanded() {
    if (!containerRef.value) return

    isExpanding.value = true
    isCollapsing.value = false
    transitionEnabled.value = false
    heightPx.value = `${containerRef.value.getBoundingClientRect().height}px`
    transform.value = 'translateY(0)'
  }

  // height를 직접 애니메이션하면 매 프레임 레이아웃을 다시 계산해서 뚝뚝 끊려 보이므로,
  // 높이는 미리 최종 값으로 고정해두고 transform(translateY)만 움직여서 GPU로 부드럽게 슬라이드시킨다.
  async function expand(onDone: () => void) {
    if (!sheetRef.value || !containerRef.value || isExpanding.value) return

    const startHeight = sheetRef.value.getBoundingClientRect().height
    const targetHeight = containerRef.value.getBoundingClientRect().height
    const offset = targetHeight - startHeight

    isExpanding.value = true
    transitionEnabled.value = false
    heightPx.value = `${targetHeight}px`
    transform.value = `translateY(${offset}px)`

    await nextTick()
    // 위에서 바뀐 스타일이 먼저 한 프레임 그려지도록 강제 리플로우를 유도한 다음 트랜지션을 건다.
    void sheetRef.value.offsetHeight

    requestAnimationFrame(() => {
      transitionEnabled.value = true
      transform.value = 'translateY(0)'
    })

    window.setTimeout(onDone, 320)
  }

  function collapse(onDone: () => void) {
    if (!sheetRef.value || !containerRef.value || !isExpanding.value || isCollapsing.value) return

    // 중간에 원래 크기로 멈췄다가 다시 사라지지 않도록, 펼쳐진 자리에서 화면 아래로 한 번에 슬라이드시킨다.
    const targetHeight = containerRef.value.getBoundingClientRect().height

    isCollapsing.value = true
    transitionEnabled.value = true
    transform.value = `translateY(${targetHeight}px)`

    window.setTimeout(onDone, 320)
  }

  return {
    isExpanding,
    isCollapsing,
    heightPx,
    transform,
    transitionEnabled,
    expand,
    collapse,
    reset,
    snapExpanded,
  }
}
