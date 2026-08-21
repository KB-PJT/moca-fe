import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CARD_ISSUERS,
  DEFAULT_CARD_ISSUER_ACCENT_COLOR,
} from '@/domains/card/constants/cardIssuers'
import {
  fetchHomeCards,
  resolveHomeCardAccentColor,
  toHomeOwnedCard,
  type HomeCardResponse,
  type HomeCardsResponse,
} from '../homeCards'
import { clearHomeCardsPrefetch, prefetchHomeCards } from '../homeCardsPrefetch'

const mocks = vi.hoisted(() => ({
  accessToken: 'access-token' as string | null,
  get: vi.fn<(url: string) => Promise<unknown>>(),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => ({ accessToken: mocks.accessToken }),
}))

vi.mock('@/shared/api/client', () => ({
  default: { get: mocks.get },
}))

describe('homeCards API', () => {
  beforeEach(() => {
    clearHomeCardsPrefetch()
    mocks.accessToken = 'access-token'
    vi.clearAllMocks()
  })

  it('홈 보유카드 응답의 data를 반환한다', async () => {
    const responseData: HomeCardsResponse = {
      yearMonth: '2026-08',
      orderMode: 'AUTO',
      selectedUserCardId: 'card-1',
      cards: [],
    }
    mocks.get.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(fetchHomeCards()).resolves.toEqual(responseData)
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/home/cards')
  })

  it('홈 데이터가 없는 404 응답은 빈 상태로 처리한다', async () => {
    mocks.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    })

    await expect(fetchHomeCards()).resolves.toBeNull()
  })

  it('미리 시작한 홈 카드 요청을 화면에서 중복 호출 없이 재사용한다', async () => {
    const responseData: HomeCardsResponse = {
      yearMonth: '2026-08',
      orderMode: 'AUTO',
      cards: [],
    }
    mocks.get.mockResolvedValue({ data: { success: true, data: responseData } })

    const prefetchedRequest = prefetchHomeCards()

    await expect(fetchHomeCards()).resolves.toEqual(responseData)
    await expect(prefetchedRequest).resolves.toEqual(responseData)
    expect(mocks.get).toHaveBeenCalledOnce()
  })

  it('인증 세션이 바뀌면 이전 세션에서 미리 요청한 홈 카드 응답을 재사용하지 않는다', async () => {
    const firstSessionResponse = {
      yearMonth: '2026-08',
      orderMode: 'AUTO' as const,
      cards: [],
    }
    const nextSessionResponse = {
      yearMonth: '2026-09',
      orderMode: 'AUTO' as const,
      cards: [],
    }
    mocks.get
      .mockResolvedValueOnce({ data: { success: true, data: firstSessionResponse } })
      .mockResolvedValueOnce({ data: { success: true, data: nextSessionResponse } })

    await prefetchHomeCards()
    mocks.accessToken = 'next-access-token'

    await expect(fetchHomeCards()).resolves.toEqual(nextSessionResponse)
    expect(mocks.get).toHaveBeenCalledTimes(2)
  })

  it('API 카드 응답을 홈 카드 모델로 변환한다', () => {
    expect(
      toHomeOwnedCard({
        userCardId: 'card-1',
        order: 1,
        cardName: 'KB My WE:SH',
        issuerName: 'KB국민카드',
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
      }),
    ).toMatchObject({
      id: 'card-1',
      name: 'KB My WE:SH',
      imageUrl: 'https://example.com/card.png',
      accentColor: CARD_ISSUERS['kb-kookmin'].accentColor,
      highlightBenefitTitle: '카페 10% 할인',
      receivedBenefitAmount: 12_000,
      availableBenefitAmount: 8_000,
      performance: { currentAmount: 300_000, targetAmount: 500_000 },
    })
  })

  it('카드사 ID와 카드명에 따라 동일한 대표색을 반환한다', () => {
    const createCard = (overrides: Partial<HomeCardResponse>): HomeCardResponse => ({
      userCardId: 'card-id',
      order: 1,
      cardName: '카드',
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
      ...overrides,
    })

    expect(resolveHomeCardAccentColor(createCard({ issuerId: '0306' }))).toBe(
      CARD_ISSUERS.shinhan.accentColor,
    )
    expect(resolveHomeCardAccentColor(createCard({ cardName: '신한카드 Mr.Life' }))).toBe(
      CARD_ISSUERS.shinhan.accentColor,
    )
    expect(resolveHomeCardAccentColor(createCard({ cardName: '올바른POINT체크카드' }))).toBe(
      CARD_ISSUERS['nh-nonghyup'].accentColor,
    )
    expect(resolveHomeCardAccentColor(createCard({ cardName: '알 수 없는 카드' }))).toBe(
      DEFAULT_CARD_ISSUER_ACCENT_COLOR,
    )
  })
})
