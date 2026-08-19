import { nextTick, ref, type Ref } from 'vue'

// 시트를 "화면 밖 → 압축 카드 → 컨테이너 전체 높이" 사이에서 transform: translateY()만으로 움직인다.
// 트랜지션은 템플릿에 항상 켜둔 CSS 클래스 하나에 맡기고(Vue <Transition>의 enter/leave 클래스는
// 쓰지 않는다 — 같은 transform을 두고 서로 경쟁하면 어느 한쪽이 씹히는 문제가 있었다), 여기서는
// 목표 transform 값만 반응형으로 계산해서 넘겨준다.
export function useSheetTransition(
  sheetRef: Ref<HTMLElement | null>,
  containerRef: Ref<HTMLElement | null>,
) {
  const isExpanding = ref(false)
  const isCollapsing = ref(false)
  const heightPx = ref<string | null>(null)
  const transform = ref<string | null>(null)
  // 압축 위치를 유지한 채 높이만 고정값으로 바꾸는 "순간 스냅" 단계에서, 트랜지션이 항상 켜져 있는
  // 탓에 그 스냅 자체까지 애니메이션되는 것을 막기 위한 임시 트랜지션 억제 플래그.
  const suppressTransition = ref(false)
  // expand() 시점의 압축 카드 높이를 기억해뒀다가, 상세에서 다시 압축 카드로 되돌아갈 때
  // (shrink()) 같은 높이로 되돌리는 데 쓴다.
  const collapsedHeightPx = ref<number | null>(null)

  function reset() {
    isExpanding.value = false
    isCollapsing.value = false
    heightPx.value = null
    transform.value = null
    suppressTransition.value = false
    collapsedHeightPx.value = null
  }

  // 압축 시트가 막 나타날 차례일 때, selectedMerchant를 반영하는 것과 같은 렌더링 틱에
  // 호출해서 화면 밖(자기 높이의 100%만큼 아래)에서 시작하도록 동기적으로 세팅한다.
  // 그래야 자연스러운 위치로 잠깐 보였다가 숨는 깜빡임 없이 처음부터 화면 밖에서 시작할 수 있다.
  function startOpen() {
    isExpanding.value = false
    isCollapsing.value = false
    heightPx.value = null
    transform.value = 'translateY(100%)'
  }

  // startOpen() 이후 DOM에 반영되고 나면, 화면 안으로 슬라이드시킨다.
  async function settleOpen() {
    if (!sheetRef.value) return

    await nextTick()
    // 위에서 바뀐 스타일(화면 밖 위치)이 먼저 한 프레임 그려지도록 강제 리플로우를 유도한다.
    void sheetRef.value.offsetHeight

    requestAnimationFrame(() => {
      transform.value = 'translateY(0)'
    })
  }

  // URL로 상세 라우트에 바로 진입했을 때처럼, 애니메이션 없이 곧바로 펼쳐진 상태로 맞춘다.
  function snapExpanded() {
    if (!containerRef.value) return

    isExpanding.value = true
    isCollapsing.value = false
    heightPx.value = `${containerRef.value.getBoundingClientRect().height}px`
    transform.value = 'translateY(0)'
  }

  // height를 직접 애니메이션하면 매 프레임 레이아웃을 다시 계산해서 뚝뚝 끊려 보이므로,
  // 높이는 미리 최종 값으로 고정해두고 transform(translateY)만 움직여서 GPU로 부드럽게 슬라이드시킨다.
  // 압축 높이에서 막 고정값으로 바뀐 시작 프레임이 먼저 한 번 그려지게 한 다음에 목표값으로 옮겨야
  // 브라우저가 두 값 사이를 보간(애니메이션)할 수 있다.
  async function expand(onDone: () => void) {
    if (!sheetRef.value || !containerRef.value || isExpanding.value) return

    const startHeight = sheetRef.value.getBoundingClientRect().height
    const targetHeight = containerRef.value.getBoundingClientRect().height
    const offset = targetHeight - startHeight

    collapsedHeightPx.value = startHeight

    // 압축 위치를 그대로 유지한 채 높이만 고정값으로 바꾸는 첫 스냅은 순간적으로 반영돼야 하므로,
    // 그동안만 트랜지션을 꺼둔다.
    suppressTransition.value = true
    isExpanding.value = true
    heightPx.value = `${targetHeight}px`
    transform.value = `translateY(${offset}px)`

    await nextTick()
    void sheetRef.value.offsetHeight

    requestAnimationFrame(() => {
      suppressTransition.value = false
      transform.value = 'translateY(0)'
    })

    window.setTimeout(onDone, 320)
  }

  // expand()의 역순: 펼쳐진 상세를 완전히 닫지 않고 압축 카드 높이로 되돌린다.
  // expand()가 기억해둔 collapsedHeightPx가 없으면(딥링크로 곧장 상세에 진입한 경우 등)
  // 되돌릴 목표 높이를 알 수 없으므로 애니메이션하지 않고 false를 반환한다 — 호출부가
  // 이 경우엔 대신 완전히 닫도록(collapse) 처리해야 한다.
  function shrink(onDone: () => void): boolean {
    if (!sheetRef.value || !containerRef.value || isCollapsing.value) return false
    if (collapsedHeightPx.value === null) return false

    const currentHeight = sheetRef.value.getBoundingClientRect().height
    const offset = currentHeight - collapsedHeightPx.value

    isCollapsing.value = true
    transform.value = `translateY(${offset}px)`

    window.setTimeout(async () => {
      // 압축 높이만큼 밀려난 상태(고정 height + offset)와, 자연 높이로 돌아간 상태(height:auto
      // + offset 0)는 화면에 보이는 위치가 동일하므로, 트랜지션을 잠깐 끄고 순간적으로 스왑한다.
      suppressTransition.value = true
      isExpanding.value = false
      isCollapsing.value = false
      heightPx.value = null
      transform.value = 'translateY(0)'

      if (sheetRef.value) {
        await nextTick()
        void sheetRef.value.offsetHeight
      }

      requestAnimationFrame(() => {
        suppressTransition.value = false
      })

      onDone()
    }, 320)

    return true
  }

  // 압축이든 펼침이든, 지금 상태와 상관없이 화면 아래로 완전히 슬라이드시켜 닫는다.
  // 이미 화면에 자리 잡고 정착된 상태에서 값만 바꾸는 것이므로, expand()/startOpen()과 달리
  // 별도로 리플로우를 강제하지 않아도 트랜지션 클래스가 항상 켜져 있어 바로 애니메이션된다.
  function collapse(onDone: () => void) {
    if (!containerRef.value || isCollapsing.value) return

    // 중간에 원래 크기로 멈췄다가 다시 사라지지 않도록, 있던 자리에서 화면 아래로 한 번에 슬라이드시킨다.
    const targetHeight = containerRef.value.getBoundingClientRect().height

    isCollapsing.value = true
    transform.value = `translateY(${targetHeight}px)`

    window.setTimeout(onDone, 320)
  }

  return {
    isExpanding,
    isCollapsing,
    heightPx,
    transform,
    suppressTransition,
    startOpen,
    settleOpen,
    expand,
    shrink,
    collapse,
    reset,
    snapExpanded,
  }
}
