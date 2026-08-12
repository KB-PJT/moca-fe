import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BenefitHistoryResult } from '@/domains/home/api/benefitHistory'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'
import BenefitHistoryView from '@/domains/home/views/BenefitHistoryView.vue'

const fetchBenefitHistory = vi.hoisted(() =>
  vi.fn<(params: { yearMonth: string; userCardId: string }) => Promise<unknown>>(),
)
const fetchHomeCards = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

vi.mock('@/domains/home/api/benefitHistory', () => ({ fetchBenefitHistory }))
vi.mock('@/domains/home/api/homeCards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/home/api/homeCards')>()),
  fetchHomeCards,
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
      paymentAmount: 15_000,
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
    })
    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('1,500원')
    expect(wrapper.text()).toContain('총 1건')
    expect(wrapper.text()).toContain('스타벅스')

    await wrapper.get('button[aria-label="스타벅스 내역 상세 보기"]').trigger('click')
    expect(wrapper.get('[data-detail-sheet]').attributes('data-open')).toBe('true')
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
})
