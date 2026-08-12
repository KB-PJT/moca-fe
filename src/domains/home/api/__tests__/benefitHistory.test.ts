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
              benefitType: 'DISCOUNT',
              benefitTitle: '카페 10% 할인',
              userCardId: 'card-1',
              cardName: 'KB My WE:SH',
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
})
