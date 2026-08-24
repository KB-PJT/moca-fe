import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BenefitHistoryResult } from '@/domains/home/api/benefitHistory'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'
import BenefitHistoryView from '@/domains/home/views/BenefitHistoryView.vue'

const fetchBenefitHistory = vi.hoisted(() =>
  vi.fn<
    (params: {
      yearMonth: string
      userCardId: string
      sort: 'LATEST' | 'BENEFIT_DESC'
    }) => Promise<unknown>
  >(),
)
const fetchHomeCards = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

vi.mock('@/domains/home/api/benefitHistory', () => ({ fetchBenefitHistory }))
vi.mock('@/domains/home/api/homeCards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/home/api/homeCards')>()),
  fetchHomeCards,
}))

let routeQuery = reactive<{ userCardId?: string }>({})

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
}))

const cardsResponse: HomeCardsResponse = {
  yearMonth: '2026-08',
  orderMode: 'AUTO',
  cards: [
    {
      userCardId: 'card-1',
      order: 1,
      cardName: 'KB My WE:SH',
      alias: null,
      cardImageUrl: null,
      highlightBenefit: {},
      summary: {
        receivedBenefitAmount: 0,
        availableBenefitAmount: 0,
        maximumMonthlyBenefitAmount: 0,
        performanceCurrentAmount: 0,
        performanceTargetAmount: 0,
        performanceRate: 0,
        performanceRemainingAmount: 0,
      },
    },
    {
      userCardId: 'card-2',
      order: 2,
      cardName: '신한 Deep Dream',
      alias: null,
      cardImageUrl: null,
      highlightBenefit: {},
      summary: {
        receivedBenefitAmount: 0,
        availableBenefitAmount: 0,
        maximumMonthlyBenefitAmount: 0,
        performanceCurrentAmount: 0,
        performanceTargetAmount: 0,
        performanceRate: 0,
        performanceRemainingAmount: 0,
      },
    },
  ],
}

const historyResult: BenefitHistoryResult = {
  items: [
    {
      id: 'benefit-1',
      merchantName: '스타벅스',
      benefitType: '할인',
      description: '카페 10% 할인',
      cardName: 'KB My WE:SH',
      cardLastFour: '',
      benefitAmount: 1_500,
      missedBenefitAmount: 0,
      paymentAmount: 15_000,
      calculationStatus: 'APPLIED',
      rejectionReason: null,
      performanceShortfall: null,
      occurredAt: '8월 12일 15:08',
      monthlyBenefitUsed: 0,
      monthlyBenefitLimit: 0,
    },
  ],
  summary: {
    totalBenefitAmount: 1_500,
    discountAmount: 1_500,
    cashbackAmount: 0,
    pointAmount: 0,
    mileageAmount: 0,
  },
  totalCount: 1,
}

describe('BenefitHistoryView', () => {
  beforeEach(() => {
    fetchHomeCards.mockReset()
    fetchHomeCards.mockResolvedValue(cardsResponse)
    fetchBenefitHistory.mockReset()
    fetchBenefitHistory.mockResolvedValue(historyResult)
    routeQuery = reactive({})
  })

  function mountView() {
    return mount(BenefitHistoryView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          BenefitDetailSheet: {
            props: ['open', 'item'],
            template: '<div data-detail-sheet :data-open="open">{{ item?.merchantName }}</div>',
          },
        },
      },
    })
  }

  it('카드와 현재 월 조건으로 전체 혜택 내역과 요약을 표시한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledWith({
      yearMonth: expect.stringMatching(/^\d{4}-\d{2}$/),
      userCardId: 'card-1',
      sort: 'LATEST',
    })
    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('1,500원')
    expect(wrapper.text()).toContain('총 1건')
    expect(wrapper.text()).toContain('스타벅스')

    await wrapper.get('button[aria-label="스타벅스 내역 상세 보기"]').trigger('click')
    expect(wrapper.get('[data-detail-sheet]').attributes('data-open')).toBe('true')
  })

  it('전체 결제금액 중 실제 혜택이 적용된 결제금액 비율을 표시한다', async () => {
    fetchBenefitHistory.mockResolvedValueOnce({
      ...historyResult,
      items: [
        historyResult.items[0]!,
        {
          ...historyResult.items[0]!,
          id: 'benefit-2',
          merchantName: '실적 미충족 가맹점',
          benefitAmount: 0,
          missedBenefitAmount: 1_000,
          paymentAmount: 5_000,
          calculationStatus: 'NOT_APPLIED',
          rejectionReason: 'PERFORMANCE_NOT_MET',
        },
      ],
    })
    const wrapper = mountView()
    await flushPromises()

    const progress = wrapper.get('[role="progressbar"]')
    expect(wrapper.text()).toContain('15,000원')
    expect(progress.attributes('aria-valuenow')).toBe('75')
    expect(progress.get('div').attributes('style')).toContain('width: 75%')
  })

  it('미적용 혜택은 거절 사유와 관계없이 일반 결제로 표시한다', async () => {
    fetchBenefitHistory.mockResolvedValueOnce({
      ...historyResult,
      items: [
        {
          ...historyResult.items[0]!,
          id: 'benefit-not-applied',
          merchantName: '미적용 가맹점',
          benefitType: '포인트',
          description: '특별 적립',
          benefitAmount: 0,
          missedBenefitAmount: 0,
          calculationStatus: 'NOT_APPLIED',
          rejectionReason: 'TARGET_NOT_MATCHED',
        },
      ],
    })

    const wrapper = mountView()
    await flushPromises()

    const item = wrapper.get('button[aria-label="미적용 가맹점 내역 상세 보기"]')
    expect(item.text()).toContain('일반 결제')
    expect(item.text()).toContain('혜택 없음')
    expect(item.text()).not.toContain('특별 적립')
    expect(item.text()).not.toContain('포인트')
  })

  it('서버가 선택한 카드로 첫 혜택 내역을 조회한다', async () => {
    fetchHomeCards.mockResolvedValueOnce({ ...cardsResponse, selectedUserCardId: 'card-2' })
    const wrapper = mountView()
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledWith({
      yearMonth: expect.any(String),
      userCardId: 'card-2',
      sort: 'LATEST',
    })
    expect(wrapper.text()).toContain('신한 Deep Dream')
  })

  it('쿼리로 넘어온 본인 소유 카드를 서버가 선택한 카드보다 우선한다', async () => {
    fetchHomeCards.mockResolvedValueOnce({ ...cardsResponse, selectedUserCardId: 'card-1' })
    routeQuery.userCardId = 'card-2'
    const wrapper = mountView()
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledWith({
      yearMonth: expect.any(String),
      userCardId: 'card-2',
      sort: 'LATEST',
    })
    expect(wrapper.text()).toContain('신한 Deep Dream')
  })

  it('쿼리로 넘어온 카드가 본인 소유가 아니면 서버가 선택한 카드를 사용한다', async () => {
    fetchHomeCards.mockResolvedValueOnce({ ...cardsResponse, selectedUserCardId: 'card-2' })
    routeQuery.userCardId = 'not-my-card'
    const wrapper = mountView()
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledWith({
      yearMonth: expect.any(String),
      userCardId: 'card-2',
      sort: 'LATEST',
    })
    expect(wrapper.text()).toContain('신한 Deep Dream')
  })

  it('월을 변경하면 변경한 월로 다시 조회한다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const firstYearMonth = String(fetchBenefitHistory.mock.calls[0]?.[0].yearMonth)

    await wrapper.get('button[aria-label="이전 달"]').trigger('click')
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledTimes(2)
    expect(fetchBenefitHistory.mock.calls[1]?.[0].yearMonth).not.toBe(firstYearMonth)
  })

  it('연도와 월을 함께 표시하고 현재 월 이후로는 이동하지 않는다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const now = new Date()

    expect(wrapper.text()).toContain(`${now.getFullYear()}년 ${now.getMonth() + 1}월`)

    const nextButton = wrapper.get('button[aria-label="다음 달"]')
    expect(nextButton.attributes('disabled')).toBeDefined()
    await nextButton.trigger('click')

    expect(fetchBenefitHistory).toHaveBeenCalledTimes(1)
  })

  it('월 이동 중에는 기존 내역을 유지하고 전체 로딩 화면을 표시하지 않는다', async () => {
    let resolveNextRequest: ((result: BenefitHistoryResult) => void) | undefined
    const wrapper = mountView()
    await flushPromises()
    fetchBenefitHistory.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNextRequest = resolve as (result: BenefitHistoryResult) => void
        }),
    )

    await wrapper.get('button[aria-label="이전 달"]').trigger('click')

    expect(wrapper.text()).toContain('스타벅스')
    expect(wrapper.find('[aria-label="혜택 내역 로딩 중"]').exists()).toBe(false)

    resolveNextRequest?.(historyResult)
    await flushPromises()
  })

  it('혜택금액순을 선택하면 서버 정렬 조건으로 다시 조회한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '혜택금액순')
      ?.trigger('click')
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenLastCalledWith({
      yearMonth: expect.any(String),
      userCardId: 'card-1',
      sort: 'BENEFIT_DESC',
    })
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    fetchBenefitHistory.mockRejectedValueOnce(new Error('network error'))
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('혜택 내역을 불러오지 못했어요.')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(fetchBenefitHistory).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('스타벅스')
  })

  it('선택한 카드의 조회 실패를 재시도해도 현재 카드를 유지한다', async () => {
    const wrapper = mountView()
    await flushPromises()
    fetchBenefitHistory.mockRejectedValueOnce(new Error('network error'))

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '신한 Deep Dream')
      ?.trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')
    await flushPromises()

    expect(fetchHomeCards).toHaveBeenCalledOnce()
    expect(fetchBenefitHistory).toHaveBeenLastCalledWith({
      yearMonth: expect.any(String),
      userCardId: 'card-2',
      sort: 'LATEST',
    })
  })

  it('이전 조회가 늦게 끝나도 최신 카드의 결과를 유지한다', async () => {
    let resolveFirstRequest: ((result: BenefitHistoryResult) => void) | undefined
    fetchBenefitHistory.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstRequest = resolve
        }),
    )
    const wrapper = mountView()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '신한 Deep Dream')
      ?.trigger('click')
    await flushPromises()
    resolveFirstRequest?.({
      ...historyResult,
      items: [{ ...historyResult.items[0]!, merchantName: '이전 요청 가맹점' }],
    })
    await flushPromises()

    expect(wrapper.text()).toContain('스타벅스')
    expect(wrapper.text()).not.toContain('이전 요청 가맹점')
  })
})
