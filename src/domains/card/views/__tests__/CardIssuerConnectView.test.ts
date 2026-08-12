import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardLinkResponse, SyncOwnedCardsResponse } from '@/domains/card/api/cardLinks'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardIssuerConnectView from '@/domains/card/views/CardIssuerConnectView.vue'

const cardLinkApiMocks = vi.hoisted(() => ({
  createCardLink: vi.fn<() => Promise<CardLinkResponse>>(),
  syncCardLinkCards: vi.fn<() => Promise<SyncOwnedCardsResponse>>(),
}))

vi.mock('@/domains/card/api/cardLinks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/card/api/cardLinks')>()),
  createCardLink: cardLinkApiMocks.createCardLink,
  syncCardLinkCards: cardLinkApiMocks.syncCardLinkCards,
}))

const globalStubs = {
  CardPageLayout: {
    emits: ['back'],
    template:
      '<main><button data-test="page-back" type="button" @click="$emit(\'back\')">뒤로</button><slot /><footer><slot name="footer" /></footer></main>',
  },
  CardIssuerIcon: {
    props: ['issuer', 'variant'],
    template: '<span />',
  },
  MocaButton: {
    props: ['disabled', 'loading', 'type'],
    template:
      '<button :type="type" :disabled="disabled || loading" :aria-busy="loading" v-bind="$attrs"><slot /></button>',
  },
  Button: {
    template: '<button v-bind="$attrs"><slot /></button>',
  },
}

async function mountAt(issuerId: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/cards/connect/select/:issuerId',
        name: 'card-issuer-connect',
        component: CardIssuerConnectView,
      },
      {
        path: '/cards/connect/select',
        name: 'card-issuer-select',
        component: { template: '<div />' },
      },
      {
        path: '/cards/connect/select/:issuerId/progress',
        name: 'card-issuer-connect-progress',
        component: { template: '<div />' },
      },
    ],
  })

  await router.push({
    name: 'card-issuer-connect',
    params: { issuerId },
  })
  await router.isReady()

  const wrapper = mount(CardIssuerConnectView, {
    global: {
      plugins: [createPinia(), router],
      stubs: globalStubs,
    },
  })

  await flushPromises()

  return { router, wrapper }
}

describe('CardIssuerConnectView', () => {
  beforeEach(() => {
    cardLinkApiMocks.createCardLink.mockReset()
    cardLinkApiMocks.createCardLink.mockReturnValue(new Promise(() => {}))
    cardLinkApiMocks.syncCardLinkCards.mockReset()
    cardLinkApiMocks.syncCardLinkCards.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          success: false,
          data: null,
          error: {
            code: 'CODEF_CONNECTION_NOT_FOUND',
            message: '활성 연동을 찾을 수 없습니다.',
          },
        },
      },
    })
  })

  it('KB는 홈페이지 로그인 정보와 카드번호, 카드 비밀번호를 입력받는다', async () => {
    const { wrapper } = await mountAt('kb-kookmin')

    expect(wrapper.text()).toContain('KB국민카드')
    expect(wrapper.text()).not.toContain('추가 인증 정보 없이 조회할 수 있어요')
    expect(wrapper.text()).not.toContain('카드 이미지 함께 불러오기')
    expect(wrapper.findAll('input')).toHaveLength(4)
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('#card-connection-cardNumber').setValue('1234-1234-1234-1234')
    await wrapper.get('#card-connection-cardPassword').setValue('1234')
    expect(wrapper.get('footer button').attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')

    await flushPromises()

    expect(cardLinkApiMocks.createCardLink).toHaveBeenCalledWith({
      institutionCode: '0301',
      id: 'moca-user',
      password: 'password',
      cardNo: '1234123412341234',
      cardPassword: '1234',
    })
  })

  it('카드번호와 비밀번호 필드는 숫자만 허용하고 비밀번호 보기 기능을 제공한다', async () => {
    const { wrapper } = await mountAt('hyundai')
    const homepagePassword = wrapper.get<HTMLInputElement>('#card-connection-homepagePassword')

    expect(wrapper.findAll('input')).toHaveLength(5)
    expect(homepagePassword.attributes('type')).toBe('password')

    await wrapper.get('button[aria-label="홈페이지 비밀번호 보기"]').trigger('click')
    expect(homepagePassword.attributes('type')).toBe('text')

    await wrapper.get('#card-connection-cardNumber').setValue('1234-5678-abcd-9012-3456')
    await wrapper.get('#card-connection-cardPassword').setValue('1a2b34')
    await wrapper.get('#card-connection-birthDate').setValue('95-01-01abc')

    expect(wrapper.get<HTMLInputElement>('#card-connection-cardNumber').element.value).toBe(
      '1234 5678 9012 3456',
    )
    expect(wrapper.get<HTMLInputElement>('#card-connection-cardPassword').element.value).toBe(
      '1234',
    )
    expect(wrapper.get<HTMLInputElement>('#card-connection-birthDate').element.value).toBe('950101')
  })

  it('현대카드는 카드정보를 포함해 연동을 한 번 생성한다', async () => {
    const { wrapper } = await mountAt('hyundai')
    cardLinkApiMocks.createCardLink.mockResolvedValue({
      linkId: 'hyundai-link-id',
      institutionCode: '0302',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [],
    })
    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('#card-connection-cardNumber').setValue('1234123412341234')
    await wrapper.get('#card-connection-cardPassword').setValue('1234')
    await wrapper.get('#card-connection-birthDate').setValue('950101')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(cardLinkApiMocks.createCardLink).toHaveBeenCalledOnce()
  })

  it('추가 인증이 없는 기관은 홈페이지 로그인 정보만 입력받는다', async () => {
    const { wrapper } = await mountAt('samsung')

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.text()).toContain('추가 인증 정보 없이 조회할 수 있어요')
  })

  it('신한카드는 홈페이지 로그인 정보만 입력받는다', async () => {
    const { wrapper } = await mountAt('shinhan')

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.find('#card-connection-birthDate').exists()).toBe(false)
  })

  it('NH농협카드는 카드번호, 카드 비밀번호, 생년월일을 필수로 입력받아 전송한다', async () => {
    const { wrapper } = await mountAt('nh-nonghyup')
    cardLinkApiMocks.createCardLink.mockResolvedValue({
      linkId: 'nh-link-id',
      institutionCode: '0304',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [],
    })
    expect(wrapper.findAll('input')).toHaveLength(5)
    expect(wrapper.text()).not.toContain('추가 인증 정보 없이 조회할 수 있어요')
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('#card-connection-cardNumber').setValue('1234-1234-1234-1234')
    await wrapper.get('#card-connection-cardPassword').setValue('1234')
    await wrapper.get('#card-connection-birthDate').setValue('95-01-01')

    expect(wrapper.get('footer button').attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(cardLinkApiMocks.createCardLink).toHaveBeenCalledWith({
      institutionCode: '0304',
      id: 'moca-user',
      password: 'password',
      cardNo: '1234123412341234',
      cardPassword: '1234',
      birthDate: '950101',
    })
  })

  it('실제 공통 버튼으로 footer에서 기관 입력 form을 제출하고 조회 화면으로 이동한다', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: CardIssuerConnectView,
        },
        {
          path: '/cards/connect/select/:issuerId/progress',
          name: 'card-issuer-connect-progress',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-connect', params: { issuerId: 'samsung' } })
    await router.isReady()

    const wrapper = mount(CardIssuerConnectView, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          CardPageLayout: globalStubs.CardPageLayout,
          CardIssuerIcon: globalStubs.CardIssuerIcon,
        },
      },
    })
    await flushPromises()

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('footer button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-connect-progress')
  })

  it('카드 연동 성공 응답을 store에 저장한다', async () => {
    const { router, wrapper } = await mountAt('samsung')
    const store = useDirectCardConnectionStore()
    cardLinkApiMocks.createCardLink.mockResolvedValue({
      linkId: 'link-id',
      institutionCode: '0303',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [
        {
          userCardId: 'user-card-id',
          cardId: 'card-id',
          cardName: '삼성카드',
          cardNo: '1234567890123456',
          institutionCode: '0303',
          issuerName: '삼성카드',
          cardType: 'CREDIT',
          cardImageUrl: null,
          matched: true,
          supported: true,
          optionGroups: [],
        },
      ],
    })

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-connect-progress')
    expect(store.lookupStatus).toBe('success')
    expect(store.linkId).toBe('link-id')
    expect(store.discoveredCards[0]?.name).toBe('삼성카드')
  })

  it('이미 연동된 카드사는 인증정보 입력 없이 보유카드를 재조회한다', async () => {
    cardLinkApiMocks.syncCardLinkCards.mockResolvedValue({
      results: [
        {
          linkId: 'link-id',
          institutionCode: '0302',
          success: true,
          cards: [
            {
              userCardId: null,
              cardId: null,
              cardName: '현대카드 M',
              cardNo: '1234********5678',
              institutionCode: '0302',
              issuerName: '현대카드',
              cardType: 'CREDIT',
              cardImageUrl: null,
              matched: false,
              supported: false,
              optionGroups: [],
            },
          ],
        },
      ],
    })

    const { router, wrapper } = await mountAt('hyundai')
    const store = useDirectCardConnectionStore()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(cardLinkApiMocks.createCardLink).not.toHaveBeenCalled()
    expect(cardLinkApiMocks.syncCardLinkCards).toHaveBeenCalledWith('0302')
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-progress')
    expect(store.lookupStatus).toBe('success')
    expect(store.linkId).toBe('link-id')
    expect(store.discoveredCards[0]?.name).toBe('현대카드 M')
  })

  it('보유카드 동기화 실패 시 중복 연동 방지를 위해 폼 대신 재시도를 표시한다', async () => {
    cardLinkApiMocks.syncCardLinkCards.mockRejectedValue(new Error('network failure'))

    const { wrapper } = await mountAt('hyundai')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('연동 상태를 확인하지 못했어요')
    expect(wrapper.text()).toContain('다시 시도하기')
    expect(cardLinkApiMocks.createCardLink).not.toHaveBeenCalled()
  })

  it('연동 상태 확인 실패 화면에서 뒤로가면 카드사 선택 화면으로 이동한다', async () => {
    cardLinkApiMocks.syncCardLinkCards.mockRejectedValue(new Error('network failure'))

    const { router, wrapper } = await mountAt('hyundai')

    await wrapper.get('[data-test="page-back"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-select')
    expect(useDirectCardConnectionStore().lookupStatus).toBe('idle')
  })

  it('카드 연동 실패 시 민감정보가 아닌 안내 오류만 store에 저장한다', async () => {
    const { wrapper } = await mountAt('samsung')
    const store = useDirectCardConnectionStore()
    cardLinkApiMocks.createCardLink.mockRejectedValue(new Error('network failure'))

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(store.lookupStatus).toBe('failed')
    expect(store.lookupError).toEqual({
      message: '카드사 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    })
    expect(JSON.stringify(store.$state)).not.toContain('moca-user')
    expect(JSON.stringify(store.$state)).not.toContain('password')
  })

  it('카드사가 변경되면 입력값과 validation 오류를 초기화한다', async () => {
    const { router, wrapper } = await mountAt('hyundai')

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-cardNumber').setValue('1234')
    await wrapper.get('#card-connection-cardNumber').trigger('blur')
    expect(wrapper.text()).toContain('16자리로 입력해 주세요')
    expect(wrapper.get('#card-connection-cardNumber').attributes('aria-describedby')).toBe(
      'card-connection-cardNumber-description',
    )
    expect(wrapper.get('[role="alert"]').text()).toContain('16자리로 입력해 주세요')

    await router.push({
      name: 'card-issuer-connect',
      params: { issuerId: 'woori' },
    })
    await flushPromises()

    expect(wrapper.findAll('input')).toHaveLength(3)
    expect(wrapper.get<HTMLInputElement>('#card-connection-homepageId').element.value).toBe('')
    expect(wrapper.text()).not.toContain('16자리로 입력해 주세요')

    await wrapper.get('#card-connection-birthDate').setValue('95-01-01abc')
    expect(wrapper.get<HTMLInputElement>('#card-connection-birthDate').element.value).toBe('950101')
  })
})
