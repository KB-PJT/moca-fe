import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardManageView from '@/domains/card/views/CardManageView.vue'
import { MOCK_MANAGED_CARDS } from '@/domains/card/mocks/managedCards'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'

const apiMocks = vi.hoisted(() => ({
  fetchMyCards: vi.fn<() => Promise<unknown>>(),
  deactivateMyCard: vi.fn<(userCardId: string) => Promise<void>>(),
  disconnectMyCard: vi.fn<(userCardId: string) => Promise<void>>(),
  reorderMyCards: vi.fn<(userCardIds: string[]) => Promise<unknown>>(),
  syncCardLinkCards: vi.fn<() => Promise<unknown>>(),
  activateCardLinkCards: vi.fn<() => Promise<unknown>>(),
  submitCardCredentials: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('@/domains/card/api/cardLinks', () => ({
  syncCardLinkCards: apiMocks.syncCardLinkCards,
  activateCardLinkCards: apiMocks.activateCardLinkCards,
  submitCardCredentials: apiMocks.submitCardCredentials,
}))

vi.mock('@/domains/card/api/cardManagement', () => ({
  fetchMyCards: apiMocks.fetchMyCards,
  deactivateMyCard: apiMocks.deactivateMyCard,
  disconnectMyCard: apiMocks.disconnectMyCard,
  reorderMyCards: apiMocks.reorderMyCards,
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

const push = vi.fn<(location: { name: string; params?: Record<string, string> }) => void>()
const replace =
  vi.fn<(location: { name: string; query?: Record<string, string> }) => Promise<void>>()
const routeQuery: Record<string, string | string[] | undefined> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push, replace }),
}))

const invalidateQueries = vi.fn<(filters: { queryKey: unknown[] }) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

const globalStubs = {
  PageLayout: {
    props: ['showBack', 'hasBottomBar'],
    template:
      '<main :data-show-back="showBack" :data-has-bottom-bar="hasBottomBar"><slot /><footer><slot name="footer" /></footer></main>',
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
      'subject',
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
        <p>{{ subject }}</p>
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
  CardCredentialDialog: {
    props: ['open', 'cardName', 'cardNo', 'errors', 'loading'],
    emits: ['update:open', 'submit'],
    template: `
      <div v-if="open" data-credential-dialog>
        <p>{{ cardName }}</p>
        <p v-if="errors.form" role="alert">{{ errors.form }}</p>
        <button
          type="button"
          :disabled="loading"
          @click="$emit('submit', { cardNo: '1234567890125678', cardPassword: '1234' })"
        >
          인증정보 제출
        </button>
        <button type="button" :disabled="loading" @click="$emit('update:open', false)">
          취소
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
    replace.mockReset()
    replace.mockResolvedValue(undefined)
    invalidateQueries.mockReset()
    invalidateQueries.mockResolvedValue(undefined)
    apiMocks.fetchMyCards.mockReset()
    apiMocks.fetchMyCards.mockResolvedValue(createMyCardsResponse())
    apiMocks.deactivateMyCard.mockReset()
    apiMocks.deactivateMyCard.mockResolvedValue(undefined)
    apiMocks.disconnectMyCard.mockReset()
    apiMocks.disconnectMyCard.mockResolvedValue(undefined)
    apiMocks.reorderMyCards.mockReset()
    apiMocks.reorderMyCards.mockResolvedValue(createMyCardsResponse())
    apiMocks.syncCardLinkCards.mockReset()
    apiMocks.syncCardLinkCards.mockResolvedValue({
      results: [
        {
          linkId: 'shinhan-link-id',
          institutionCode: '0306',
          success: true,
          cards: [
            {
              userCardId: 'managed-shinhan-deep-dream',
              cardId: 'shinhan-deep-dream',
              cardName: '신한 Deep Dream',
              cardNo: '123456******8847',
              institutionCode: '0306',
              issuerName: '신한카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: true,
              supported: true,
              optionGroups: [],
            },
          ],
        },
      ],
    })
    apiMocks.activateCardLinkCards.mockReset()
    apiMocks.activateCardLinkCards.mockResolvedValue({
      linkId: 'shinhan-link-id',
      activatedUserCardIds: ['managed-shinhan-deep-dream'],
      activatedCount: 1,
    })
    apiMocks.submitCardCredentials.mockReset()
    apiMocks.submitCardCredentials.mockResolvedValue({
      userCardId: 'managed-kb-wesh-disabled',
      cardId: 'kb-wesh',
      cardName: 'KB My WE:SH',
      cardNo: '123456******4321',
      institutionCode: '0301',
      issuerName: 'KB국민카드',
      cardType: 'CREDIT',
      cardImageUrl: null,
      matched: true,
      supported: true,
      optionGroups: [],
    })
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
    expect(wrapper.get('[data-active-card-section]').classes()).toContain('-mt-6')
    expect(wrapper.get('[data-card-management-toolbar]').classes()).toContain('mb-1')
    expect(wrapper.get('[data-inactive-card-section]').classes()).toContain('mt-8')
    expect(wrapper.get('[data-inactive-card-summary]').classes()).toContain('opacity-60')
    expect(wrapper.get('[data-inactive-card]').classes()).not.toContain('opacity-60')
  })

  it('비활성 카드 목록을 접고 다시 펼친다', async () => {
    const wrapper = await mountView()
    const toggle = wrapper.get('button[aria-label="비활성 카드 접기"]')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[data-inactive-card]').exists()).toBe(true)

    await toggle.trigger('click')

    expect(wrapper.find('[data-inactive-card]').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="비활성 카드 펼치기"]').attributes('aria-expanded')).toBe(
      'false',
    )

    await wrapper.get('button[aria-label="비활성 카드 펼치기"]').trigger('click')

    expect(wrapper.find('[data-inactive-card]').exists()).toBe(true)
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

  it('확인 후 카드를 비활성화하고 기존 카드 연결 API로 다시 활성화한다', async () => {
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')

    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.text()).toContain('카드를 비활성화할까요?')
    expect(wrapper.text()).toContain('등록된 카드 3개')

    await wrapper.get('button[aria-label="비활성화 확인"]').trigger('click')
    await flushPromises()

    expect(apiMocks.deactivateMyCard).toHaveBeenCalledWith('managed-shinhan-deep-dream')
    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).toContain('비활성화 된 카드 2개')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards', 'my-cards'] })

    await wrapper.get('button[aria-label="신한 Deep Dream 활성화"]').trigger('click')
    await flushPromises()

    expect(apiMocks.syncCardLinkCards).toHaveBeenCalledWith('0306')
    expect(apiMocks.activateCardLinkCards).toHaveBeenCalledWith('shinhan-link-id', {
      activeUserCardIds: ['managed-shinhan-deep-dream'],
    })
    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.get('[data-card-activation-status]').text()).toContain(
      '승인내역은 별도 동기화 후 반영되며, 바로 보이지 않을 수 있어요.',
    )
    expect(invalidateQueries).toHaveBeenCalledTimes(2)
  })

  it('옵션 선택이 필요한 카드는 기존 선택 화면에서 이어서 활성화한다', async () => {
    apiMocks.syncCardLinkCards.mockResolvedValueOnce({
      results: [
        {
          linkId: 'kb-link-id',
          institutionCode: '0301',
          success: true,
          cards: [
            {
              userCardId: 'managed-kb-wesh-disabled',
              cardId: 'kb-wesh',
              cardName: 'KB My WE:SH',
              cardNo: '123456******4321',
              institutionCode: '0301',
              issuerName: 'KB국민카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: true,
              supported: true,
              optionGroups: [
                {
                  optionGroupId: 'benefit-type',
                  groupKey: 'benefitType',
                  groupName: '혜택 유형',
                  choices: [
                    {
                      optionChoiceId: 'food',
                      choiceKey: 'food',
                      choiceName: '음식점',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 활성화"]').trigger('click')
    await flushPromises()

    const directCardConnectionStore = useDirectCardConnectionStore()
    expect(apiMocks.syncCardLinkCards).toHaveBeenCalledWith('0301')
    expect(apiMocks.activateCardLinkCards).not.toHaveBeenCalled()
    expect(directCardConnectionStore.linkId).toBe('kb-link-id')
    expect(directCardConnectionStore.selectedCardIds).toEqual(['managed-kb-wesh-disabled'])
    expect(push).toHaveBeenCalledWith({
      name: 'card-issuer-card-select',
      params: { issuerId: 'kb-kookmin' },
    })
  })

  it('활성화에 카드정보가 필요하면 입력받은 뒤 활성화를 다시 요청한다', async () => {
    apiMocks.syncCardLinkCards.mockResolvedValueOnce({
      results: [
        {
          linkId: 'kb-link-id',
          institutionCode: '0301',
          success: true,
          cards: [
            {
              userCardId: 'managed-kb-wesh-disabled',
              cardId: 'kb-wesh',
              cardName: 'KB My WE:SH',
              cardNo: '123456******4321',
              institutionCode: '0301',
              issuerName: 'KB국민카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: true,
              supported: true,
              optionGroups: [],
            },
          ],
        },
      ],
    })
    apiMocks.activateCardLinkCards
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            success: false,
            data: null,
            error: {
              code: 'CARD_CREDENTIAL_REQUIRED',
              message: '카드 활성화에 필요한 카드번호/비밀번호가 없습니다.',
              fields: { userCardId: 'managed-kb-wesh-disabled' },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        linkId: 'kb-link-id',
        activatedUserCardIds: ['managed-kb-wesh-disabled'],
        activatedCount: 1,
      })
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 활성화"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-credential-dialog]').text()).toContain('KB My WE:SH')

    await wrapper.get('[data-credential-dialog] button').trigger('click')
    await flushPromises()

    expect(apiMocks.submitCardCredentials).toHaveBeenCalledWith('managed-kb-wesh-disabled', {
      cardNo: '1234567890125678',
      cardPassword: '1234',
    })
    expect(apiMocks.activateCardLinkCards).toHaveBeenCalledTimes(2)
    expect(apiMocks.activateCardLinkCards).toHaveBeenLastCalledWith('kb-link-id', {
      activeUserCardIds: ['managed-kb-wesh-disabled'],
    })
    expect(wrapper.find('[data-credential-dialog]').exists()).toBe(false)
    expect(wrapper.text()).toContain('등록된 카드 4개')
    expect(wrapper.text()).toContain('비활성화 된 카드 0개')
    expect(wrapper.get('[data-card-activation-status]').text()).toContain(
      '승인내역은 별도 동기화 후 반영되며, 바로 보이지 않을 수 있어요.',
    )
  })

  it('카드정보 확인에 실패하면 입력창을 유지하고 서버 오류를 안내한다', async () => {
    apiMocks.syncCardLinkCards.mockResolvedValueOnce({
      results: [
        {
          linkId: 'kb-link-id',
          institutionCode: '0301',
          success: true,
          cards: [
            {
              userCardId: 'managed-kb-wesh-disabled',
              cardId: 'kb-wesh',
              cardName: 'KB My WE:SH',
              cardNo: '123456******4321',
              institutionCode: '0301',
              issuerName: 'KB국민카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: true,
              supported: true,
              optionGroups: [],
            },
          ],
        },
      ],
    })
    apiMocks.activateCardLinkCards.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          data: null,
          error: {
            code: 'CARD_CREDENTIAL_REQUIRED',
            message: '카드 활성화에 필요한 카드번호/비밀번호가 없습니다.',
            fields: { userCardId: 'managed-kb-wesh-disabled' },
          },
        },
      },
    })
    apiMocks.submitCardCredentials.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          data: null,
          error: {
            code: 'CODEF_INVALID_CREDENTIALS',
            message: '카드 정보를 다시 확인해 주세요.',
          },
        },
      },
    })
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 활성화"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-credential-dialog] button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-credential-dialog]').text()).toContain(
      '카드 정보를 다시 확인해 주세요.',
    )
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
  })

  it('카드정보 입력을 취소하면 비활성 상태를 유지한다', async () => {
    apiMocks.syncCardLinkCards.mockResolvedValueOnce({
      results: [
        {
          linkId: 'kb-link-id',
          institutionCode: '0301',
          success: true,
          cards: [
            {
              userCardId: 'managed-kb-wesh-disabled',
              cardId: 'kb-wesh',
              cardName: 'KB My WE:SH',
              cardNo: '123456******4321',
              institutionCode: '0301',
              issuerName: 'KB국민카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: true,
              supported: true,
              optionGroups: [],
            },
          ],
        },
      ],
    })
    apiMocks.activateCardLinkCards.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          data: null,
          error: {
            code: 'CARD_CREDENTIAL_REQUIRED',
            message: '카드 활성화에 필요한 카드번호/비밀번호가 없습니다.',
            fields: { userCardId: 'managed-kb-wesh-disabled' },
          },
        },
      },
    })
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 활성화"]').trigger('click')
    await flushPromises()
    await wrapper.findAll('[data-credential-dialog] button')[1]?.trigger('click')

    expect(wrapper.find('[data-credential-dialog]').exists()).toBe(false)
    expect(apiMocks.submitCardCredentials).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
  })

  it('카드 활성화 요청 중 버튼을 반복해서 눌러도 동기화를 한 번만 실행한다', async () => {
    let resolveSync!: (value: unknown) => void
    apiMocks.syncCardLinkCards.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSync = resolve
      }),
    )
    const wrapper = await mountView()
    const activateButton = wrapper.get('button[aria-label="KB My WE:SH 활성화"]')

    await activateButton.trigger('click')
    await activateButton.trigger('click')

    expect(apiMocks.syncCardLinkCards).toHaveBeenCalledOnce()
    expect(activateButton.attributes()).toHaveProperty('disabled')

    resolveSync({ results: [] })
    await flushPromises()
  })

  it('카드 활성화에 실패하면 비활성 상태를 유지하고 다시 시도하도록 안내한다', async () => {
    apiMocks.syncCardLinkCards.mockRejectedValueOnce(new Error('network error'))
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 활성화"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('카드를 활성화하지 못했어요.')
    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
  })

  it('확인 후 연결 해제한 카드를 목록에서 제거한다', async () => {
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 연결 해제"]').trigger('click')

    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.text()).toContain('카드 연결을 해제할까요?')
    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.get('[data-confirm-dialog]').attributes('data-destructive')).toBe('true')

    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')
    await flushPromises()

    expect(apiMocks.disconnectMyCard).toHaveBeenCalledWith('managed-shinhan-deep-dream')
    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).not.toContain('신한 Deep Dream')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards', 'my-cards'] })
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

  it('활성 카드 전체의 변경된 순서를 API에 저장하고 응답 목록을 반영한다', async () => {
    let resolveReorder!: (value: unknown) => void
    apiMocks.reorderMyCards.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveReorder = resolve
      }),
    )
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

    expect(apiMocks.reorderMyCards).toHaveBeenCalledWith([
      'managed-shinhan-deep-dream',
      'managed-kb-wesh',
      'managed-hyundai-zero',
    ])

    const reorderedResponse = createMyCardsResponse()
    reorderedResponse.activeCards = [
      reorderedResponse.activeCards[1]!,
      reorderedResponse.activeCards[0]!,
      reorderedResponse.activeCards[2]!,
    ]
    resolveReorder(reorderedResponse)
    await flushPromises()

    expect(
      wrapper.findAll('li[data-card-id]').map((item) => item.attributes('data-card-id')),
    ).toEqual(['managed-shinhan-deep-dream', 'managed-kb-wesh', 'managed-hyundai-zero'])
    expect(wrapper.text()).not.toContain('저장 중')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards', 'my-cards'] })
  })

  it('카드 순서 저장에 실패하면 변경 전 순서로 복원한다', async () => {
    apiMocks.reorderMyCards.mockRejectedValueOnce(new Error('network error'))
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
      .find((button) => button.text() === '저장')
      ?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('카드 순서를 저장하지 못했어요.')
    expect(
      wrapper.findAll('li[data-card-id]').map((item) => item.attributes('data-card-id')),
    ).toEqual(['managed-kb-wesh', 'managed-shinhan-deep-dream', 'managed-hyundai-zero'])
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

  it('비활성 카드만 있으면 재활성화 안내와 계정 및 고객지원 동선을 표시한다', async () => {
    const response = createMyCardsResponse()
    response.inactiveCards = [...response.activeCards, ...response.inactiveCards]
    response.activeCards = []
    apiMocks.fetchMyCards.mockResolvedValue(response)
    routeQuery.required = 'activate'

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('카드를 다시 활성화해 주세요')
    expect(wrapper.get('main').attributes('data-show-back')).toBe('false')
    expect(wrapper.find('nav').exists()).toBe(false)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '계정 및 고객지원')
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'mypage' })
  })

  it('재활성화 모드에서 카드를 활성화하면 홈으로 이동한다', async () => {
    const response = createMyCardsResponse()
    response.inactiveCards = [...response.activeCards, ...response.inactiveCards]
    response.activeCards = []
    apiMocks.fetchMyCards.mockResolvedValue(response)
    routeQuery.required = 'activate'
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 활성화"]').trigger('click')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({ name: 'home' })
    expect(useCardManagementStore().consumeActivationNotice()).toContain(
      '승인내역은 별도 동기화 후 반영되며, 바로 보이지 않을 수 있어요.',
    )
  })

  it('마지막 활성 카드를 비활성화하면 재활성화 모드로 전환한다', async () => {
    const response = createMyCardsResponse()
    response.activeCards = response.activeCards.slice(0, 1)
    response.inactiveCards = []
    apiMocks.fetchMyCards.mockResolvedValue(response)
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 비활성화"]').trigger('click')
    await wrapper.get('button[aria-label="비활성화 확인"]').trigger('click')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({
      name: 'card-manage',
      query: { required: 'activate' },
    })
  })

  it('마지막 카드 연결을 해제하면 강제 카드 연동 화면으로 이동한다', async () => {
    const response = createMyCardsResponse()
    response.activeCards = response.activeCards.slice(0, 1)
    response.inactiveCards = []
    apiMocks.fetchMyCards.mockResolvedValue(response)
    const wrapper = await mountView()

    await wrapper.get('button[aria-label="KB My WE:SH 연결 해제"]').trigger('click')
    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({
      name: 'card-connect',
      query: { required: 'true' },
    })
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
