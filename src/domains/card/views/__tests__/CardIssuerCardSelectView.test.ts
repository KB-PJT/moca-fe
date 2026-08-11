import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type {
  ActivateCardLinkCardsRequest,
  ActivateCardLinkCardsResponse,
  CardLinkCardResponse,
  SubmitCardCredentialsRequest,
} from '@/domains/card/api/cardLinks'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'
import CardIssuerCardSelectView from '@/domains/card/views/CardIssuerCardSelectView.vue'

const cardLinkApiMocks = vi.hoisted(() => ({
  activateCardLinkCards:
    vi.fn<
      (
        linkId: string,
        request: ActivateCardLinkCardsRequest,
      ) => Promise<ActivateCardLinkCardsResponse>
    >(),
  submitCardCredentials:
    vi.fn<
      (userCardId: string, request: SubmitCardCredentialsRequest) => Promise<CardLinkCardResponse>
    >(),
}))

vi.mock('@/domains/card/api/cardLinks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/card/api/cardLinks')>()),
  activateCardLinkCards: cardLinkApiMocks.activateCardLinkCards,
  submitCardCredentials: cardLinkApiMocks.submitCardCredentials,
}))

const globalStubs = {
  CardPageLayout: {
    emits: ['back'],
    template:
      '<main><button type="button" aria-label="뒤로가기" @click="$emit(\'back\')" /><slot /><footer><slot name="footer" /></footer></main>',
  },
  MocaButton: {
    props: ['disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  Checkbox: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" @click="$emit(\'update:modelValue\', modelValue === true ? false : true)" />',
  },
  CardImage: {
    props: ['src', 'alt'],
    template: '<img :src="src" :alt="alt" />',
  },
  CardCredentialDialog: {
    props: ['open', 'cardName', 'cardNo', 'errors', 'loading'],
    emits: ['update:open', 'submit'],
    template:
      '<div data-test="credential-dialog">{{ cardName }}<button type="button" @click="$emit(\'submit\', { cardNo: \'1234567890125678\', cardPassword: \'1234\' })">인증정보 제출</button></div>',
  },
}

describe('CardIssuerCardSelectView', () => {
  beforeEach(() => {
    cardLinkApiMocks.activateCardLinkCards.mockReset()
    cardLinkApiMocks.activateCardLinkCards.mockImplementation(async (linkId, request) => ({
      linkId,
      activatedUserCardIds: request.activeUserCardIds,
      activatedCount: request.activeUserCardIds.length,
    }))
    cardLinkApiMocks.submitCardCredentials.mockReset()
    cardLinkApiMocks.submitCardCredentials.mockImplementation(async (userCardId) => ({
      userCardId,
      cardId: 'card-id',
      cardName: '현대카드',
      cardNo: '1234********5678',
      institutionCode: '0302',
      issuerName: '현대카드',
      cardType: 'CREDIT',
      cardImageUrl: null,
      matched: true,
      supported: true,
      optionGroups: [],
    }))
  })

  it('상단 뒤로가기로 카드사 선택 화면으로 돌아간다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    directStore.beginLookup('kb-kookmin')
    directStore.completeLookup([
      {
        id: 'selected-card',
        userCardId: 'selected-card',
        issuer: 'kb-kookmin',
        name: 'KB 카드',
        last4: '4710',
      },
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    await wrapper.get('button[aria-label="뒤로가기"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-select')
    expect(directStore.lookupStatus).toBe('idle')
  })

  it('카드 활성화 중에는 뒤로가지 않고 요청 시작 시점의 선택 카드로 완료 처리한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    const ownedCardsStore = useOwnedCardsStore()
    directStore.beginLookup('kb-kookmin')
    directStore.linkId = 'link-id'
    directStore.completeLookup([
      {
        id: 'activation-snapshot-card',
        userCardId: 'activation-snapshot-card',
        issuer: 'kb-kookmin',
        name: 'KB 스냅샷 카드',
        last4: '4710',
      },
    ])

    let resolveActivation: ((response: ActivateCardLinkCardsResponse) => void) | undefined
    cardLinkApiMocks.activateCardLinkCards.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveActivation = resolve
        }),
    )

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    await wrapper.get('footer button').trigger('click')
    await wrapper.get('button[aria-label="뒤로가기"]').trigger('click')

    expect(router.currentRoute.value.name).toBe('card-issuer-card-select')
    expect(directStore.lookupStatus).toBe('success')

    directStore.selectedCardIds = []
    resolveActivation?.({
      linkId: 'link-id',
      activatedUserCardIds: ['activation-snapshot-card'],
      activatedCount: 1,
    })
    await flushPromises()

    expect(ownedCardsStore.ownedCards.some((card) => card.id === 'activation-snapshot-card')).toBe(
      true,
    )
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('모든 카드를 기본 선택하고 선택한 카드만 보유카드에 추가한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    const ownedCardsStore = useOwnedCardsStore()
    directStore.beginLookup('kb-kookmin')
    directStore.linkId = 'link-id'
    directStore.completeLookup([
      {
        id: 'selected-card-1',
        userCardId: 'selected-card-1',
        issuer: 'kb-kookmin',
        name: 'KB 카드 1',
        last4: '4710',
        cardNo: '4***********710*',
        imageUrl: 'https://example.com/kb-card.png',
      },
      {
        id: 'selected-card-2',
        userCardId: 'selected-card-2',
        issuer: 'kb-kookmin',
        name: 'KB 카드 2',
        last4: '2222',
      },
    ])
    const initialOwnedCardCount = ownedCardsStore.ownedCards.length

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('2개 카드를 찾았어요')
    expect(wrapper.text()).toContain('4***********710*')
    expect(wrapper.text()).not.toContain('•••• 4710')
    expect(wrapper.get('img[alt="KB 카드 1 카드 이미지"]').attributes('src')).toBe(
      'https://example.com/kb-card.png',
    )
    expect(wrapper.get('footer button').text()).toContain('선택한 카드 2개')

    await wrapper.get('button[aria-label="전체 카드 선택"]').trigger('click')
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('button[aria-label="KB 카드 1 선택"]').trigger('click')
    expect(wrapper.get('footer button').text()).toContain('선택한 카드 1개')

    await wrapper.get('footer button').trigger('click')
    await nextTick()
    await flushPromises()

    expect(cardLinkApiMocks.activateCardLinkCards).toHaveBeenCalledWith('link-id', {
      activeUserCardIds: ['selected-card-1'],
    })
    expect(ownedCardsStore.ownedCards).toHaveLength(initialOwnedCardCount + 1)
    expect(ownedCardsStore.ownedCards[ownedCardsStore.ownedCards.length - 1]?.id).toBe(
      'selected-card-1',
    )
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('카드 활성화 API가 실패하면 현재 화면에서 오류를 표시한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    directStore.beginLookup('kb-kookmin')
    directStore.linkId = 'link-id'
    directStore.completeLookup([
      {
        id: 'selected-card',
        userCardId: 'selected-card',
        issuer: 'kb-kookmin',
        name: 'KB 카드',
        last4: '4710',
      },
    ])
    cardLinkApiMocks.activateCardLinkCards.mockRejectedValue(new Error('network failure'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    await wrapper.get('footer button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('카드 활성화 중 오류가 발생했습니다')
    expect(router.currentRoute.value.name).toBe('card-issuer-card-select')
  })

  it('인증정보가 필요한 카드 ID에 정보를 저장하고 활성화를 다시 시도한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    directStore.beginLookup('hyundai')
    directStore.linkId = 'link-id'
    directStore.completeLookup([
      {
        id: 'user-card-1',
        userCardId: 'user-card-1',
        issuer: 'hyundai',
        name: '현대카드 1',
        last4: '1111',
      },
      {
        id: 'user-card-2',
        userCardId: 'user-card-2',
        issuer: 'hyundai',
        name: '현대카드 2',
        last4: '5678',
      },
    ])
    cardLinkApiMocks.activateCardLinkCards
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            success: false,
            data: null,
            error: {
              code: 'CARD_CREDENTIAL_REQUIRED',
              message: '카드 활성화에 필요한 카드번호/비밀번호가 없습니다.',
              fields: { userCardId: 'user-card-2' },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        linkId: 'link-id',
        activatedUserCardIds: ['user-card-1', 'user-card-2'],
        activatedCount: 2,
      })
    let resolveCredentials: ((response: CardLinkCardResponse) => void) | undefined
    cardLinkApiMocks.submitCardCredentials.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCredentials = resolve
        }),
    )

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'hyundai' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    await wrapper.get('footer button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="credential-dialog"]').text()).toContain('현대카드 2')

    await wrapper.get('[data-test="credential-dialog"] button').trigger('click')
    await wrapper.get('button[aria-label="뒤로가기"]').trigger('click')

    expect(router.currentRoute.value.name).toBe('card-issuer-card-select')
    expect(directStore.lookupStatus).toBe('success')

    resolveCredentials?.({
      userCardId: 'user-card-2',
      cardId: 'card-id',
      cardName: '현대카드 2',
      cardNo: '1234********5678',
      institutionCode: '0302',
      issuerName: '현대카드',
      cardType: 'CREDIT',
      cardImageUrl: null,
      matched: true,
      supported: true,
      optionGroups: [],
    })
    await flushPromises()

    expect(cardLinkApiMocks.submitCardCredentials).toHaveBeenCalledWith('user-card-2', {
      cardNo: '1234567890125678',
      cardPassword: '1234',
    })
    expect(cardLinkApiMocks.activateCardLinkCards).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('선택형 카드의 옵션을 모두 고른 뒤에만 불러오기 버튼을 활성화한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    directStore.beginLookup('kb-kookmin')
    directStore.completeLookup([
      {
        id: 'option-card',
        userCardId: 'option-card',
        issuer: 'kb-kookmin',
        name: 'KB 선택형 카드',
        last4: '1111',
        matched: true,
        optionGroups: [
          {
            optionGroupId: 'benefit-group',
            groupKey: 'benefit',
            groupName: '혜택 패키지',
            choices: [
              {
                optionChoiceId: 'shopping-choice',
                choiceKey: 'shopping',
                choiceName: '쇼핑 중심',
              },
              {
                optionChoiceId: 'living-choice',
                choiceKey: 'living',
                choiceName: '생활 중심',
              },
            ],
          },
        ],
      },
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('혜택 패키지')
    expect(wrapper.text()).toContain('선택한 카드의 옵션을 모두 골라 주세요')
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('input[value="shopping-choice"]').setValue()

    expect(directStore.optionSelections).toEqual({
      'option-card': { 'benefit-group': 'shopping-choice' },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('footer button').attributes('disabled')).toBeUndefined()
  })
})
