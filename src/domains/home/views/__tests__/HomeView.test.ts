import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CARD_ISSUERS } from '@/domains/card/constants/cardIssuers'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'
import type { HomeGreetingResponse } from '@/domains/home/api/homeGreeting'
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import { MOCK_HOME_OWNED_CARDS } from '@/domains/home/mocks/ownedCards'
import HomeView from '@/domains/home/views/HomeView.vue'

const fetchHomeCards = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const fetchHomeGreeting = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const fetchRecentBenefits = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

vi.mock('@/domains/home/api/homeCards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/home/api/homeCards')>()),
  fetchHomeCards,
}))

vi.mock('@/domains/home/api/homeGreeting', () => ({ fetchHomeGreeting }))

vi.mock('@/domains/home/api/recentBenefits', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/home/api/recentBenefits')>()),
  fetchRecentBenefits,
}))

const recentBenefits: RecentBenefitItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `benefit-${index + 1}`,
  merchantName: index === 0 ? '맥도날드' : index === 1 ? '스타벅스' : `가맹점 ${index + 1}`,
  benefitType: index % 3 === 0 ? '할인' : index % 3 === 1 ? '캐시백' : '포인트',
  description: index === 1 ? '카페 10% 할인' : '적용 혜택',
  cardName: index === 0 ? 'KB국민 청춘대로 톡톡카드' : 'KB My WE:SH',
  cardLastFour: '',
  benefitAmount: index === 1 ? 1_500 : 1_000,
  missedBenefitAmount: 0,
  paymentAmount: 10_000,
  calculationStatus: 'APPLIED',
  rejectionReason: null,
  performanceShortfall: null,
  occurredAt: `8월 ${12 - index}일 12:00`,
  monthlyBenefitUsed: 0,
  monthlyBenefitLimit: 0,
}))

recentBenefits[0] = {
  ...recentBenefits[0]!,
  benefitType: null,
  description: '일반 결제',
  benefitAmount: 0,
}

const homeGreeting: HomeGreetingResponse = {
  nickname: '지민',
  yearMonth: '2026-08',
  missedBenefitAmount: 8_200,
  message: '이번 달 혜택 8,200원을 놓치고 있어요!',
}

function createHomeCardsResponse(): HomeCardsResponse {
  const highlightBenefitTitles = [
    '스타벅스, 폴바셋 10% 할인',
    '대중교통 10% 청구 할인',
    '공과금 10% 할인',
    '국내외 가맹점 0.8% 할인',
  ]

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
      highlightBenefit: { title: highlightBenefitTitles[index] ?? '' },
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
    fetchHomeGreeting.mockReset()
    fetchHomeGreeting.mockResolvedValue(homeGreeting)
    fetchRecentBenefits.mockReset()
    fetchRecentBenefits.mockResolvedValue(recentBenefits)
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

  it('카드 활성화 후 승인내역 반영 지연 안내를 한 번 표시한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useCardManagementStore().setActivationNotice(
      '카드가 활성화됐어요. 승인내역은 별도 동기화 후 반영되며, 바로 보이지 않을 수 있어요.',
    )

    const firstVisit = mountView(pinia)
    await flushPromises()

    expect(firstVisit.get('[data-card-activation-notice]').text()).toContain(
      '승인내역은 별도 동기화 후 반영되며, 바로 보이지 않을 수 있어요.',
    )

    firstVisit.unmount()
    const nextVisit = mountView(pinia)
    await flushPromises()

    expect(nextVisit.find('[data-card-activation-notice]').exists()).toBe(false)
  })

  it('관리 링크를 통해 홈에서 카드 관리 화면으로 이동한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    const manageLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '관리')

    expect(manageLink?.props('to')).toEqual({ name: 'card-manage', query: { from: 'home' } })
    expect(
      new Set(
        wrapper.findAll('[data-owned-card]').map((card) => card.attributes('data-card-index')),
      ).size,
    ).toBe(4)
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
    expect(wrapper.get('[data-selected-card-info]').classes()).toContain('min-h-16')
    const expectedAccent = document.createElement('span')
    expectedAccent.style.backgroundColor = CARD_ISSUERS['kb-kookmin'].accentColor
    expect(wrapper.get('[data-selected-card-accent]').classes()).toContain('size-2.5')
    const selectedCardAccent = wrapper.get('[data-selected-card-accent]').element as HTMLElement
    expect(selectedCardAccent.style.backgroundColor).toBe(expectedAccent.style.backgroundColor)
    expect(selectedCardAccent.style.backgroundImage).toContain('linear-gradient')
    expect(wrapper.get('[data-card-benefit-amounts]').classes()).toContain('min-h-20')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('21,800원')
    expect(wrapper.get('[data-received-benefit]').classes()).toContain('text-heading')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('8,200원')
    expect(wrapper.get('[data-available-benefit]').classes()).toContain('text-heading')
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
      query: { from: 'home' },
    })

    const memoLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('aria-label') === 'KB My WE:SH 메모 확인하기')

    expect(memoLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-wesh' },
      query: { from: 'home' },
    })
    expect(wrapper.get('[data-card-memo]').text()).toContain('스타벅스, 폴바셋 10% 할인')
  })

  it('사용자 인사와 놓치고 있는 혜택을 표시하고 리포트로 연결한다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const reportLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '보러가기')

    expect(wrapper.text()).toContain('안녕하세요, 지민님')
    expect(wrapper.text()).toContain('이번 달 혜택 8,200원을 놓치고 있어요!')
    expect(fetchHomeGreeting).toHaveBeenCalledWith()
    expect(reportLink?.props('to')).toEqual({ name: 'report' })

    const benefitHistoryLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '전체보기')
    expect(benefitHistoryLink?.props('to')).toEqual({ name: 'home-benefits' })
  })

  it('홈 인사 조회 실패 후 다시 시도할 수 있다', async () => {
    fetchHomeGreeting.mockRejectedValueOnce(new Error('network error'))
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('홈 혜택 정보를 불러오지 못했어요.')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(fetchHomeGreeting).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('안녕하세요, 지민님')
  })

  it('최근 혜택 API 내역 5건을 표시한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('최근 전체 내역')
    expect(wrapper.text()).toContain('혜택 없음')
    expect(wrapper.text()).toContain('일반 결제')
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
    await flushPromises()

    await wrapper.get('button[aria-label="스타벅스 내역 상세 보기"]').trigger('click')

    const detailSheet = wrapper.getComponent(BenefitDetailSheet)
    expect(detailSheet.props('open')).toBe(true)
    expect(detailSheet.props('item')).toMatchObject({ merchantName: '스타벅스' })
  })

  it('최근 혜택 조회 실패 후 다시 시도할 수 있다', async () => {
    fetchRecentBenefits.mockRejectedValueOnce(new Error('network error'))
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('최근 결제 내역을 불러오지 못했어요.')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(fetchRecentBenefits).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('스타벅스')
  })

  it('재시도 결과가 먼저 끝나면 지연된 이전 요청이 화면을 덮어쓰지 않는다', async () => {
    let resolveFirstRequest: ((items: RecentBenefitItem[]) => void) | undefined
    fetchRecentBenefits.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstRequest = resolve
        }),
    )
    const wrapper = mountView()
    await flushPromises()

    await wrapper.getComponent({ name: 'RecentBenefitHistory' }).vm.$emit('retry')
    await flushPromises()
    resolveFirstRequest?.([{ ...recentBenefits[0]!, merchantName: '이전 요청 가맹점' }])
    await flushPromises()

    expect(wrapper.text()).toContain('스타벅스')
    expect(wrapper.text()).not.toContain('이전 요청 가맹점')
  })

  it('옆 카드를 선택하면 선택 카드와 페이지 표시가 함께 변경된다', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-owned-card][data-card-index="1"][tabindex="0"]').trigger('click')

    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('1')
    const activeIndicator = wrapper.get('[data-card-indicator-active]').element as HTMLElement
    expect(activeIndicator.style.width).toBe('25%')
    expect(activeIndicator.style.left).toBe('25%')
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB국민 청춘대로 톡톡카드')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('16,400원')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('6,600원')
    expect(wrapper.get('[data-performance-rate]').text()).toBe('실적 달성 현황(80%)')
    expect(wrapper.get('[data-performance-remaining]').text()).toContain('59,000원')
    expect(wrapper.text()).toContain('이번 달 혜택 8,200원을 놓치고 있어요!')

    const detailLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text().includes('상세보기'))
    expect(detailLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-taptap' },
      query: { from: 'home' },
    })
  })

  it('카드 상세에서 홈으로 돌아오면 이전에 선택한 카드를 복원한다', async () => {
    const pinia = createPinia()
    const firstVisit = mountView(pinia)
    await flushPromises()

    await firstVisit.get('[data-owned-card][data-card-index="1"][tabindex="0"]').trigger('click')
    expect(firstVisit.get('[data-selected-card-name]').text()).toBe('KB국민 청춘대로 톡톡카드')
    firstVisit.unmount()

    const returnedVisit = mountView(pinia)
    await flushPromises()

    expect(
      returnedVisit.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('1')
    expect(returnedVisit.get('[data-selected-card-name]').text()).toBe('KB국민 청춘대로 톡톡카드')
  })

  it('첫 카드의 이전은 마지막 카드이고 마지막 카드의 다음은 첫 카드다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const carousel = wrapper.get('[data-card-carousel]')
    const carouselElement = carousel.element as HTMLElement
    carouselElement.setPointerCapture = vi.fn<(pointerId: number) => void>()
    carouselElement.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(() => true)
    carouselElement.releasePointerCapture = vi.fn<(pointerId: number) => void>()

    carouselElement.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 100 }),
    )
    carouselElement.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 160 }))
    carouselElement.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 160 }))
    await flushPromises()

    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('3')
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('현대카드 ZERO Edition3')
    const lastCardDetailLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text().includes('상세보기'))
    expect(lastCardDetailLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-hyundai-zero' },
      query: { from: 'home' },
    })

    carouselElement.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 160 }),
    )
    carouselElement.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100 }))
    carouselElement.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 100 }))
    await flushPromises()

    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('0')
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
  })

  it('카드 캐러셀을 드래그하는 동안 페이지 스크롤을 막는다', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[data-card-carousel]').classes()).toContain('touch-none')
  })

  it('카드가 두 장이면 첫 카드와 마지막 카드에서 순환하지 않는다', async () => {
    const response = createHomeCardsResponse()
    response.cards = response.cards.slice(0, 2)
    response.selectedUserCardId = response.cards[0]?.userCardId ?? null
    fetchHomeCards.mockResolvedValue(response)

    const wrapper = mountView()
    await flushPromises()
    const carousel = wrapper.get('[data-card-carousel]')
    const carouselElement = carousel.element as HTMLElement
    carouselElement.setPointerCapture = vi.fn<(pointerId: number) => void>()
    carouselElement.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(() => true)
    carouselElement.releasePointerCapture = vi.fn<(pointerId: number) => void>()

    const swipe = async (fromX: number, toX: number) => {
      carouselElement.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: fromX }),
      )
      carouselElement.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: toX }))
      carouselElement.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: toX }))
      await flushPromises()
    }

    await swipe(100, 160)
    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('0')

    await swipe(160, 100)
    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('1')

    await swipe(160, 100)
    expect(
      wrapper.get('[data-owned-card][aria-current="true"]').attributes('data-card-index'),
    ).toBe('1')
  })

  it('서버 alias가 있어도 대표 혜택을 표시한다', async () => {
    const response = createHomeCardsResponse()
    const firstCard = response.cards[0]
    if (!firstCard) throw new Error('test card is required')

    firstCard.userCardId = 'empty-memo-card-id'
    firstCard.alias = '서버 메모'
    firstCard.highlightBenefit = { title: '온라인 쇼핑몰 10% 청구 할인' }
    response.selectedUserCardId = firstCard.userCardId
    fetchHomeCards.mockResolvedValue(response)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[data-card-memo]').text()).toBe('온라인 쇼핑몰 10% 청구 할인')
  })

  it('서버 alias가 비어 있어도 대표 혜택을 표시한다', async () => {
    const response = createHomeCardsResponse()
    const firstCard = response.cards[0]
    if (!firstCard) throw new Error('test card is required')

    firstCard.userCardId = 'highlight-benefit-card-id'
    firstCard.alias = null
    firstCard.highlightBenefit = { title: '온라인 쇼핑몰 10% 청구 할인' }
    response.selectedUserCardId = firstCard.userCardId
    fetchHomeCards.mockResolvedValue(response)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[data-card-memo]').text()).toBe('온라인 쇼핑몰 10% 청구 할인')
  })

  it('서버 alias는 카드명과 카드 위 대표 혜택에 사용하지 않는다', async () => {
    const response = createHomeCardsResponse()
    const firstCard = response.cards[0]
    if (!firstCard) throw new Error('test card is required')

    firstCard.userCardId = 'real-user-card-id'
    firstCard.alias = '슈퍼솔져'
    firstCard.highlightBenefit = { title: '간편결제 10% 청구 할인' }
    response.selectedUserCardId = firstCard.userCardId
    fetchHomeCards.mockResolvedValue(response)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
    expect(wrapper.get('[data-card-memo]').text()).toBe('간편결제 10% 청구 할인')
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
    expect(
      new Set(
        wrapper.findAll('[data-owned-card]').map((card) => card.attributes('data-card-index')),
      ).size,
    ).toBe(4)
  })
})
