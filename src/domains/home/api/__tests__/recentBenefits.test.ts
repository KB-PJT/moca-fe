import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRecentBenefits,
  toRecentBenefitItem,
  type RecentBenefitResponse,
} from '@/domains/home/api/recentBenefits'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<
    (
      url: string,
      config: { params: { yearMonth?: string; limit: number; userCardId?: string } },
    ) => Promise<unknown>
  >(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

const benefit: RecentBenefitResponse = {
  approvalId: 'approval-1',
  benefitHistoryId: 'benefit-1',
  merchantName: '스타벅스',
  benefitType: 'DISCOUNT',
  benefitTitle: '카페 10% 할인',
  cardName: 'KB My WE:SH',
  paymentAmount: 15_000,
  benefitAmount: 1_500,
  missedBenefitAmount: 0,
  calculationStatus: 'APPLIED',
  rejectionReason: null,
  occurredAt: '2026-08-12T06:08:47.909Z',
}

const generalPayment: RecentBenefitResponse = {
  approvalId: 'approval-2',
  benefitHistoryId: null,
  merchantName: '다이소',
  benefitType: null,
  benefitTitle: null,
  cardName: 'KB My WE:SH',
  paymentAmount: 7_000,
  benefitAmount: 0,
  missedBenefitAmount: 0,
  calculationStatus: 'NOT_APPLIED',
  rejectionReason: null,
  occurredAt: '2026-08-12T05:00:00.000Z',
}

describe('recentBenefits API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('최근 혜택 5건을 요청하고 화면 모델로 변환한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: { success: true, data: { history: [benefit, generalPayment] } },
    })

    await expect(fetchRecentBenefits()).resolves.toEqual([
      toRecentBenefitItem(benefit),
      toRecentBenefitItem(generalPayment),
    ])
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/home/recent-history', {
      params: { limit: 5 },
    })
  })

  it('선택한 카드의 최근 승인 내역을 요청한다', async () => {
    apiClientMocks.get.mockResolvedValue({
      data: { success: true, data: { history: [benefit] } },
    })

    await fetchRecentBenefits({ yearMonth: '2026-08', limit: 5, userCardId: 'card-1' })

    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/home/recent-history', {
      params: { yearMonth: '2026-08', limit: 5, userCardId: 'card-1' },
    })
  })

  it('서버 혜택 유형과 발생 시각을 화면 형식으로 변환한다', () => {
    expect(toRecentBenefitItem(benefit)).toMatchObject({
      id: 'approval-1',
      benefitType: '할인',
      description: '카페 10% 할인',
      occurredAt: '8월 12일 15:08',
    })
  })

  it('카드명 뒤의 마스킹된 카드번호를 제거한다', () => {
    expect(
      toRecentBenefitItem({
        ...benefit,
        cardName: '신한카드 Point Plan 체크 캐릭터형(짱구) 44991481****721*',
      }).cardName,
    ).toBe('신한카드 Point Plan 체크 캐릭터형(짱구)')
  })

  it('혜택이 없는 승인 내역을 일반 결제로 변환한다', () => {
    expect(toRecentBenefitItem(generalPayment)).toMatchObject({
      id: 'approval-2',
      benefitType: null,
      description: '일반 결제',
      benefitAmount: 0,
      paymentAmount: 7_000,
    })
  })
})
