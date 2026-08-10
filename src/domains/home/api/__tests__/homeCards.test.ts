import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHomeCards, toHomeOwnedCard, type HomeCardsResponse } from '../homeCards'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

describe('homeCards API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('홈 보유카드 응답의 data를 반환한다', async () => {
    const responseData: HomeCardsResponse = {
      yearMonth: '2026-08',
      orderMode: 'AUTO',
      selectedUserCardId: 'card-1',
      cards: [],
    }
    apiClientMocks.get.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(fetchHomeCards()).resolves.toEqual(responseData)
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/home/cards')
  })

  it('홈 데이터가 없는 404 응답은 빈 상태로 처리한다', async () => {
    apiClientMocks.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    })

    await expect(fetchHomeCards()).resolves.toBeNull()
  })

  it('API 카드 응답을 홈 카드 모델로 변환한다', () => {
    expect(
      toHomeOwnedCard(
        {
          userCardId: 'card-1',
          order: 1,
          cardName: 'KB My WE:SH',
          alias: '카페 카드',
          cardImageUrl: 'https://example.com/card.png',
          highlightBenefit: { title: '카페 10% 할인' },
          summary: {
            receivedBenefitAmount: 12_000,
            availableBenefitAmount: 8_000,
            maximumMonthlyBenefitAmount: 20_000,
            performanceCurrentAmount: 300_000,
            performanceTargetAmount: 500_000,
            performanceRate: 60,
            performanceRemainingAmount: 200_000,
          },
        },
        0,
      ),
    ).toMatchObject({
      id: 'card-1',
      name: 'KB My WE:SH',
      memo: '카페 카드',
      imageUrl: 'https://example.com/card.png',
      highlightBenefitTitle: '카페 10% 할인',
      receivedBenefitAmount: 12_000,
      availableBenefitAmount: 8_000,
      performance: { currentAmount: 300_000, targetAmount: 500_000 },
    })
  })
})
