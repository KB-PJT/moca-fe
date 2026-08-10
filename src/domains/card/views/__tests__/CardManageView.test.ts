import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardManageView from '@/domains/card/views/CardManageView.vue'
import {
  getMockManagedCardOrder,
  resetMockManagedCardOrder,
} from '@/domains/card/api/cardManagement.mock'
import { MOCK_MANAGED_CARDS } from '@/domains/card/mocks/managedCards'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'

const apiMocks = vi.hoisted(() => ({
  fetchMyCards: vi.fn<() => Promise<unknown>>(),
  deactivateMyCard: vi.fn<(userCardId: string) => Promise<void>>(),
  disconnectMyCard: vi.fn<(userCardId: string) => Promise<void>>(),
}))

vi.mock('@/domains/card/api/cardManagement', () => ({
  fetchMyCards: apiMocks.fetchMyCards,
  deactivateMyCard: apiMocks.deactivateMyCard,
  disconnectMyCard: apiMocks.disconnectMyCard,
}))

function createMyCardsResponse() {
  const toApiCard = (card: (typeof MOCK_MANAGED_CARDS)[number]) => ({
    userCardId: card.id,
    cardName: card.name,
    cardNo: card.last4 ? `123456******${card.last4}` : null,
    issuerId: `${card.id}-issuer`,
    issuerName: card.issuerName,
    cardImageUrl: card.imageUrl ?? null,
    memo: null,
  })

  return {
    lastSyncedAt: '2026-08-07T10:30:00+09:00',
    activeCards: MOCK_MANAGED_CARDS.filter((card) => card.isActive).map(toApiCard),
    inactiveCards: MOCK_MANAGED_CARDS.filter((card) => !card.isActive).map(toApiCard),
  }
}

const push = vi.fn<(location: { name: string }) => void>()
const routeQuery: Record<string, string | string[] | undefined> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push }),
}))

const globalStubs = {
  PageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  BottomBar: {
    props: ['activePath'],
    template: '<nav :data-active-path="activePath" />',
  },
  CardImage: {
    template: '<span />',
  },
  MocaButton: {
    emits: ['click'],
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  },
  ConfirmDialog: {
    props: [
      'open',
      'title',
      'description',
      'confirmLabel',
      'cancelLabel',
      'destructive',
      'loading',
      'errorMessage',
    ],
    emits: ['update:open', 'cancel', 'confirm'],
    template: `
      <div v-if="open" data-confirm-dialog :data-destructive="destructive">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
        <button :disabled="loading" @click="$emit('cancel'); $emit('update:open', false)">
          {{ cancelLabel ?? '취소' }}
        </button>
        <button :aria-label="confirmLabel + ' 확인'" :disabled="loading" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    `,
  },
}

async function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(CardManageView, {
    global: { plugins: [pinia], stubs: globalStubs },
  })
  await flushPromises()
  return wrapper
}

describe('CardManageView', () => {
  beforeEach(() => {
    push.mockClear()
    apiMocks.fetchMyCards.mockReset()
    apiMocks.fetchMyCards.mockResolvedValue(createMyCardsResponse())
    apiMocks.deactivateMyCard.mockReset()
    apiMocks.deactivateMyCard.mockResolvedValue(undefined)
    apiMocks.disconnectMyCard.mockReset()
    apiMocks.disconnectMyCard.mockResolvedValue(undefined)
    resetMockManagedCardOrder()
    for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('활성 카드와 비활성 카드를 구분해 표시한다', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.text()).toContain('현대 Zero Edition')
    expect(wrapper.text()).toContain('신한카드 · 123456******8847')
    expect(wrapper.text()).toContain('KB국민카드 · 123456******4321')
  })

  it('상세 화면의 로컬 변경 후 진입하면 목록을 한 번 보존한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const cardManagementStore = useCardManagementStore()
    cardManagementStore.setCards(createMyCardsResponse())
    cardManagementStore.setCardActive('managed-shinhan-deep-dream', false)
    cardManagementStore.preserveCardsOnNextLoad()

    const firstWrapper = mount(CardManageView, {
      global: { plugins: [pinia], stubs: globalStubs },
    })
    await flushPromises()

    expect(apiMocks.fetchMyCards).not.toHaveBeenCalled()
    expect(firstWrapper.text()).toContain('등록된 카드 2개')
    expect(firstWrapper.text()).toContain('비활성화 된 카드 2개')

    firstWrapper.unmount()
    const secondWrapper = mount(CardManageView, {
      global: { plugins: [pinia], stubs: globalStubs },
    })
    await flushPromises()

    expect(apiMocks.fetchMyCards).toHaveBeenCalledOnce()
    expect(secondWrapper.text()).toContain('등록된 카드 3개')
  })

  it('확인 후 카드를 비활성화하고 다시 활성화한다', async () => {
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')

    expect(wrapper.text()).toContain('신한 Deep Dream 카드를 비활성화할까요?')
    expect(wrapper.text()).toContain('등록된 카드 3개')

    await wrapper.get('button[aria-label="비활성화 확인"]').trigger('click')
    await flushPromises()

    expect(apiMocks.deactivateMyCard).toHaveBeenCalledWith('managed-shinhan-deep-dream')
    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).toContain('비활성화 된 카드 2개')

    await wrapper.get('button[aria-label="신한 Deep Dream 활성화"]').trigger('click')

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
  })

  it('확인 후 연결 해제한 카드를 목록에서 제거한다', async () => {
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 연결 해제"]').trigger('click')

    expect(wrapper.text()).toContain('신한 Deep Dream 카드 연결을 해제할까요?')
    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.get('[data-confirm-dialog]').attributes('data-destructive')).toBe('true')

    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')
    await flushPromises()

    expect(apiMocks.disconnectMyCard).toHaveBeenCalledWith('managed-shinhan-deep-dream')
    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).not.toContain('신한 Deep Dream')
  })

  it('카드 연결 해제에 실패하면 목록을 유지하고 다시 시도하도록 안내한다', async () => {
    apiMocks.disconnectMyCard.mockRejectedValueOnce(new Error('network error'))
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 연결 해제"]').trigger('click')
    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.get('[role="alert"]').text()).toContain('카드 연결을 해제하지 못했어요.')
  })

  it('카드 액션 요청 중 확인을 반복해도 API를 한 번만 호출한다', async () => {
    let resolveDisconnect!: () => void
    apiMocks.disconnectMyCard.mockReturnValue(
      new Promise((resolve) => {
        resolveDisconnect = resolve
      }),
    )
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 연결 해제"]').trigger('click')
    const confirmButton = wrapper.get('button[aria-label="연결 해제 확인"]')
      .element as HTMLButtonElement
    confirmButton.click()
    confirmButton.click()
    await nextTick()

    expect(apiMocks.disconnectMyCard).toHaveBeenCalledOnce()

    resolveDisconnect()
    await flushPromises()
  })

  it('취소하면 카드 상태를 변경하지 않는다', async () => {
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')
    expect(wrapper.get('[data-confirm-dialog]').attributes('data-destructive')).toBe('false')

    await wrapper.get('[data-confirm-dialog] button').trigger('click')

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.find('[data-confirm-dialog]').exists()).toBe(false)
  })

  it('새로고침 중 상태를 표시하고 실 API를 다시 호출한다', async () => {
    const wrapper = await mountView()
    let resolveRefresh!: (value: unknown) => void
    apiMocks.fetchMyCards.mockImplementationOnce(
      () => new Promise((resolve) => (resolveRefresh = resolve)),
    )

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')
    await wrapper.get('button[aria-label="카드 목록 새로고침"]').trigger('click')

    expect(wrapper.text()).toContain('새로고침 중')

    resolveRefresh(createMyCardsResponse())
    await flushPromises()

    expect(apiMocks.fetchMyCards).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.text()).toContain('새로고침')
  })

  it('활성 카드 순서를 변경하고 mock API에 저장한다', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '순서 변경')
      ?.trigger('click')

    const sourceCard = wrapper.get('li[data-card-id="managed-shinhan-deep-dream"]')
    const targetCard = wrapper.get('li[data-card-id="managed-kb-wesh"]')
    const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true })
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: {
        effectAllowed: 'none',
        setData: vi.fn<(format: string, data: string) => void>(),
      },
    })
    sourceCard.element.dispatchEvent(dragStartEvent)
    targetCard.element.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }))
    await nextTick()

    expect(
      wrapper.findAll('li[data-card-id]').map((item) => item.attributes('data-card-id')),
    ).toEqual(['managed-shinhan-deep-dream', 'managed-kb-wesh', 'managed-hyundai-zero'])

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '저장')
      ?.trigger('click')
    expect(wrapper.text()).toContain('저장 중')

    await vi.advanceTimersByTimeAsync(300)

    expect(getMockManagedCardOrder()).toEqual([
      'managed-shinhan-deep-dream',
      'managed-kb-wesh',
      'managed-hyundai-zero',
    ])
    expect(wrapper.text()).not.toContain('카드 순서를 저장했어요.')

    const reorderedResponse = createMyCardsResponse()
    reorderedResponse.activeCards = [
      reorderedResponse.activeCards[1]!,
      reorderedResponse.activeCards[0]!,
      reorderedResponse.activeCards[2]!,
    ]
    apiMocks.fetchMyCards.mockResolvedValueOnce(reorderedResponse)
    await wrapper.get('button[aria-label="카드 목록 새로고침"]').trigger('click')
    await flushPromises()

    expect(
      wrapper.findAll('li[data-card-id]').map((item) => item.attributes('data-card-id')),
    ).toEqual(['managed-shinhan-deep-dream', 'managed-kb-wesh', 'managed-hyundai-zero'])
  })

  it('카드 순서 변경을 취소하면 기존 순서로 복원한다', async () => {
    const wrapper = await mountView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '순서 변경')
      ?.trigger('click')
    await wrapper
      .get('button[aria-label="신한 Deep Dream 순서 이동"]')
      .trigger('keydown', { key: 'ArrowUp' })
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '취소')
      ?.trigger('click')

    expect(
      wrapper.findAll('li[data-card-id]').map((item) => item.attributes('data-card-id')),
    ).toEqual(['managed-kb-wesh', 'managed-shinhan-deep-dream', 'managed-hyundai-zero'])
  })

  it('카드 추가하기를 누르면 카드 연결 화면으로 이동한다', async () => {
    const wrapper = await mountView()

    await wrapper.get('footer button').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'card-connect' })
  })

  it.each([
    ['home', '/home'],
    ['mypage', '/mypage'],
  ])('%s에서 진입하면 해당 하단 탭을 활성화한다', async (from, activePath) => {
    routeQuery.from = from

    const wrapper = await mountView()

    expect(wrapper.get('nav').attributes('data-active-path')).toBe(activePath)
  })

  it('직접 접근하면 하단 탭을 강제로 활성화하지 않는다', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('nav').attributes('data-active-path')).toBeUndefined()
  })

  it('실제 확인 다이얼로그에서 확인하면 선택한 카드 액션을 실행한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(CardManageView, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: {
          PageLayout: globalStubs.PageLayout,
          BottomBar: globalStubs.BottomBar,
          CardImage: globalStubs.CardImage,
        },
      },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')
    await nextTick()

    const confirmButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="비활성화 확인"]',
    )
    expect(confirmButton).not.toBeNull()

    confirmButton?.click()
    await flushPromises()

    expect(apiMocks.deactivateMyCard).toHaveBeenCalledWith('managed-shinhan-deep-dream')
    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).toContain('비활성화 된 카드 2개')

    wrapper.unmount()
  })

  it('실제 확인 다이얼로그에서 API 요청이 실패하면 오류를 표시하고 목록을 유지한다', async () => {
    apiMocks.deactivateMyCard.mockRejectedValueOnce(new Error('network error'))
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(CardManageView, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: {
          PageLayout: globalStubs.PageLayout,
          BottomBar: globalStubs.BottomBar,
          CardImage: globalStubs.CardImage,
        },
      },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('button[aria-label="비활성화 확인"]')?.click()
    await flushPromises()

    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      '카드를 비활성화하지 못했어요.',
    )
    expect(wrapper.text()).toContain('등록된 카드 3개')

    wrapper.unmount()
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    apiMocks.fetchMyCards.mockRejectedValueOnce(new Error('network error'))

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('보유카드를 불러오지 못했어요.')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(apiMocks.fetchMyCards).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('등록된 카드 3개')
  })
})
