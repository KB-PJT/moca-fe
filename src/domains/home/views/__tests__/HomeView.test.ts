import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'
import { MOCK_HOME_OWNED_CARDS } from '@/domains/home/mocks/ownedCards'
import HomeView from '@/domains/home/views/HomeView.vue'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

const fetchHomeCards = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

vi.mock('@/domains/home/api/homeCards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/home/api/homeCards')>()),
  fetchHomeCards,
}))

function createHomeCardsResponse(): HomeCardsResponse {
  return {
    yearMonth: '2026-08',
    orderMode: 'AUTO' as const,
    selectedUserCardId: MOCK_HOME_OWNED_CARDS[0]?.id,
    cards: MOCK_HOME_OWNED_CARDS.map((card, index) => ({
      userCardId: card.id,
      order: index + 1,
      cardName: card.name,
      alias: null,
      cardImageUrl: card.imageUrl,
      highlightBenefit: { title: '' },
      summary: {
        receivedBenefitAmount: card.receivedBenefitAmount,
        availableBenefitAmount: card.availableBenefitAmount,
        maximumMonthlyBenefitAmount: card.receivedBenefitAmount + card.availableBenefitAmount,
        performanceCurrentAmount: card.performance.currentAmount,
        performanceTargetAmount: card.performance.targetAmount,
        performanceRate: 0,
        performanceRemainingAmount: card.performance.targetAmount - card.performance.currentAmount,
      },
    })),
  }
}

describe('HomeView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    fetchHomeCards.mockReset()
    fetchHomeCards.mockResolvedValue(createHomeCardsResponse())
  })

  function mountView(pinia = createPinia()) {
    return mount(HomeView, {
      global: {
        plugins: [pinia],
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          RouterLink: RouterLinkStub,
        },
      },
    })
  }

  it('관리 링크를 통해 홈에서 카드 관리 화면으로 이동한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    const manageLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '관리')

    expect(manageLink?.props('to')).toEqual({ name: 'card-manage', query: { from: 'home' } })
    expect(wrapper.findAll('[data-owned-card]')).toHaveLength(4)
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('21,800원')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('8,200원')
    const receivedBenefitLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-received-benefit') !== undefined)
    const availableBenefitLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-available-benefit') !== undefined)
    expect(receivedBenefitLink?.props('to')).toEqual({ name: 'home-benefits' })
    expect(availableBenefitLink?.props('to')).toEqual({ name: 'report' })
    expect(wrapper.get('[data-available-benefit]').classes()).not.toContain('underline')
    expect(wrapper.get('[data-performance-rate]').text()).toBe('실적 달성 현황(76%)')
    expect(wrapper.get('[data-performance-remaining]').text()).toContain('118,000원')

    const detailLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text().includes('상세보기'))

    expect(detailLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-wesh' },
    })

    const memoLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('aria-label') === 'KB My WE:SH 메모 확인하기')

    expect(memoLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-wesh' },
    })
    expect(wrapper.get('[data-card-memo]').text()).toContain('스타벅스, 폴바셋 10% 할인')
  })

  it('사용자 인사와 놓치고 있는 혜택을 표시하고 리포트로 연결한다', async () => {
    const pinia = createPinia()
    const authStore = useAuthStore(pinia)
    authStore.setUser({ nickname: '지민', email: 'jimin@example.com', provider: 'google' })

    const wrapper = mountView(pinia)
    await flushPromises()
    const reportLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '보러가기')

    expect(wrapper.text()).toContain('안녕하세요, 지민님')
    expect(wrapper.text()).toContain('이번 달 혜택 22,900원을 놓치고 있어요!')
    expect(reportLink?.props('to')).toEqual({ name: 'report' })

    const benefitHistoryLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '전체보기')
    expect(benefitHistoryLink?.props('to')).toEqual({ name: 'home-benefits' })
  })

  it('최근 카드 승인 내역 5건을 표시한다', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('최근 전체 내역')
    expect(wrapper.text()).toContain('혜택 없음')
    expect(wrapper.text()).toContain('맥도날드')
    expect(wrapper.text()).toContain('KB국민 청춘대로 톡톡카드')
    expect(wrapper.text()).toContain('스타벅스')
    expect(wrapper.text()).toContain('-1,500원')
    expect(wrapper.findAll('button[aria-label$="내역 상세 보기"]')).toHaveLength(5)
    expect(wrapper.find('button[aria-label$="내역 상세 보기"]').attributes('aria-label')).toBe(
      '맥도날드 내역 상세 보기',
    )
  })

  it('최근 혜택을 선택하면 해당 혜택 상세 시트를 연다', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-label="스타벅스 내역 상세 보기"]').trigger('click')

    const detailSheet = wrapper.getComponent(BenefitDetailSheet)
    expect(detailSheet.props('open')).toBe(true)
    expect(detailSheet.props('item')).toMatchObject({ merchantName: '스타벅스' })
  })

  it('카드를 넘기면 선택 카드와 페이지 표시가 함께 변경된다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const carousel = wrapper.get('[data-card-carousel]')

    carousel.element.scrollLeft = 228
    await carousel.trigger('scroll')

    expect(wrapper.findAll('[data-owned-card]')[1]?.attributes('aria-current')).toBe('true')
    expect(wrapper.findAll('[data-card-indicator]')[1]?.classes()).toContain('w-6')
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB국민 청춘대로 톡톡카드')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('16,400원')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('6,600원')
    expect(wrapper.get('[data-performance-rate]').text()).toBe('실적 달성 현황(80%)')
    expect(wrapper.get('[data-performance-remaining]').text()).toContain('59,000원')
    expect(wrapper.text()).toContain('이번 달 혜택 22,900원을 놓치고 있어요!')
  })

  it('상세 화면에서 수정한 카드 메모를 홈 카드 위에 표시한다', async () => {
    const pinia = createPinia()
    const cardMemoStore = useCardMemoStore(pinia)
    cardMemoStore.setMemo('home-kb-wesh', '주말 카페 결제용 카드')

    const wrapper = mountView(pinia)
    await flushPromises()

    expect(wrapper.get('[data-card-memo]').text()).toBe('주말 카페 결제용 카드')
  })

  it('서버 메모는 카드명이 아니라 카드 위 메모 영역에 표시한다', async () => {
    const response = createHomeCardsResponse()
    const firstCard = response.cards[0]
    if (!firstCard) throw new Error('test card is required')

    firstCard.userCardId = 'real-user-card-id'
    firstCard.alias = '슈퍼솔져'
    response.selectedUserCardId = firstCard.userCardId
    fetchHomeCards.mockResolvedValue(response)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
    expect(wrapper.get('[data-card-memo]').text()).toBe('슈퍼솔져')
  })

  it('조회 결과가 없으면 보유카드 빈 상태를 표시한다', async () => {
    fetchHomeCards.mockResolvedValue(null)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('연결된 카드가 없어요')
    expect(wrapper.findAll('[data-owned-card]')).toHaveLength(0)
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    fetchHomeCards.mockRejectedValueOnce(new Error('network error'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('보유카드를 불러오지 못했어요.')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(fetchHomeCards).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('[data-owned-card]')).toHaveLength(4)
  })
})
