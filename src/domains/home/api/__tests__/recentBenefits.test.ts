import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRecentBenefits,
  toRecentBenefitItem,
  type RecentBenefitResponse,
} from '@/domains/home/api/recentBenefits'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config: { params: { limit: number } }) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

const benefit: RecentBenefitResponse = {
  benefitHistoryId: 'benefit-1',
  merchantName: '스타벅스',
  benefitType: 'DISCOUNT',
  benefitTitle: '카페 10% 할인',
  cardName: 'KB My WE:SH',
  paymentAmount: 15_000,
  benefitAmount: 1_500,
  occurredAt: '2026-08-12T06:08:47.909Z',
}

describe('recentBenefits API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('최근 혜택 5건을 요청하고 화면 모델로 변환한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: { success: true, data: { benefits: [benefit] } },
    })

    await expect(fetchRecentBenefits()).resolves.toEqual([toRecentBenefitItem(benefit)])
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/home/recent-benefits', {
      params: { limit: 5 },
    })
  })

  it('서버 혜택 유형과 발생 시각을 화면 형식으로 변환한다', () => {
    expect(toRecentBenefitItem(benefit)).toMatchObject({
      id: 'benefit-1',
      benefitType: '할인',
      description: '카페 10% 할인',
      occurredAt: '8월 12일 15:08',
    })
  })
})
