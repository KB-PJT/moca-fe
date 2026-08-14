import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchBenefitHistory } from '@/domains/home/api/benefitHistory'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config: { params: Record<string, unknown> }) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({ default: apiClientMocks }))

const summary = {
  totalBenefitAmount: 1_500,
  discountAmount: 1_500,
  cashbackAmount: 0,
  pointAmount: 0,
  mileageAmount: 0,
}

describe('benefitHistory API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('카드와 월 조건으로 혜택 이력을 조회한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [
            {
              benefitHistoryId: 'benefit-1',
              merchantName: '스타벅스',
              approvedAt: '2026-08-12T06:08:47.909Z',
              paymentAmount: 15_000,
              benefitAmount: 1_500,
              missedBenefitAmount: 0,
              benefitType: 'DISCOUNT',
              benefitTitle: '카페 10% 할인',
              userCardId: 'card-1',
              cardName: 'KB My WE:SH',
              calculationStatus: 'APPLIED',
              rejectionReason: null,
              performanceShortfall: null,
            },
          ],
          summary,
          meta: { page: 1, size: 100, totalCount: 1, hasNext: false },
        },
      },
    })

    await expect(
      fetchBenefitHistory({ yearMonth: '2026-08', userCardId: 'card-1' }),
    ).resolves.toMatchObject({
      items: [{ merchantName: '스타벅스', benefitType: '할인' }],
      summary,
      totalCount: 1,
    })
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/benefit-history', {
      params: {
        yearMonth: '2026-08',
        userCardId: 'card-1',
        sort: 'LATEST',
        page: 1,
        size: 100,
      },
    })
  })

  it('실적 미충족 혜택 정보와 혜택금액순 조건을 반영한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [
            {
              benefitHistoryId: 'benefit-2',
              merchantName: '스타벅스',
              approvedAt: '2026-08-12T06:08:47.909Z',
              paymentAmount: 15_000,
              benefitAmount: 0,
              missedBenefitAmount: 1_500,
              benefitType: 'DISCOUNT',
              benefitTitle: '카페 10% 할인',
              userCardId: 'card-1',
              cardName: 'KB My WE:SH',
              calculationStatus: 'NOT_APPLIED',
              rejectionReason: 'PERFORMANCE_NOT_MET',
              performanceShortfall: {
                requiredAmount: 300_000,
                achievedAmount: 200_000,
                remainingAmount: 100_000,
              },
            },
          ],
          summary,
          meta: { page: 1, size: 100, totalCount: 1, hasNext: false },
        },
      },
    })

    const result = await fetchBenefitHistory({
      yearMonth: '2026-08',
      userCardId: 'card-1',
      sort: 'BENEFIT_DESC',
    })

    expect(result.items[0]).toMatchObject({
      benefitType: '할인',
      benefitAmount: 0,
      missedBenefitAmount: 1_500,
      rejectionReason: 'PERFORMANCE_NOT_MET',
      performanceShortfall: { remainingAmount: 100_000 },
    })
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/benefit-history', {
      params: {
        yearMonth: '2026-08',
        userCardId: 'card-1',
        sort: 'BENEFIT_DESC',
        page: 1,
        size: 100,
      },
    })
  })

  it('혜택이 없는 일반 결제도 전체 내역 항목으로 변환한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [
            {
              benefitHistoryId: null,
              merchantName: '그린팜마트군자점',
              approvedAt: '2026-08-13T17:42:56+09:00',
              paymentAmount: 20_970,
              benefitAmount: 0,
              missedBenefitAmount: 0,
              benefitType: null,
              benefitTitle: null,
              userCardId: 'card-1',
              cardName: '올바른POINT체크카드',
              calculationStatus: 'NOT_CALCULATED',
              rejectionReason: null,
              performanceShortfall: null,
            },
          ],
          summary: {
            totalBenefitAmount: 0,
            discountAmount: 0,
            cashbackAmount: 0,
            pointAmount: 0,
            mileageAmount: 0,
          },
          meta: { page: 1, size: 100, totalCount: 1, hasNext: false },
        },
      },
    })

    const result = await fetchBenefitHistory({
      yearMonth: '2026-08',
      userCardId: 'card-1',
    })

    expect(result.items[0]).toMatchObject({
      id: 'card-1-2026-08-13T17:42:56+09:00-그린팜마트군자점-0',
      merchantName: '그린팜마트군자점',
      benefitType: null,
      description: '일반 결제',
      paymentAmount: 20_970,
      benefitAmount: 0,
      calculationStatus: 'NOT_CALCULATED',
    })
  })
})
