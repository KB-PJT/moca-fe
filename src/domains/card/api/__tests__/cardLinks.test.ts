import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activateCardLinkCards,
  createCardLink,
  submitCardCredentials,
  syncCardLinkCards,
  type ActivateCardLinkCardsResponse,
  type CardLinkResponse,
} from '@/domains/card/api/cardLinks'
import { CARD_ISSUERS } from '@/domains/card/constants/cardIssuers'

const apiClientMocks = vi.hoisted(() => ({
  post: vi.fn<(url: string, data?: unknown, config?: unknown) => Promise<unknown>>(),
  patch: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

describe('cardLinks API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('9개 카드사의 CODEF 기관코드를 제공한다', () => {
    expect(
      Object.fromEntries(
        Object.entries(CARD_ISSUERS).map(([issuerId, issuer]) => [
          issuerId,
          issuer.institutionCode,
        ]),
      ),
    ).toEqual({
      'bc-baro': '0305',
      'kb-kookmin': '0301',
      'nh-nonghyup': '0304',
      lotte: '0311',
      samsung: '0303',
      shinhan: '0306',
      woori: '0309',
      hana: '0313',
      hyundai: '0302',
    })
  })

  it('카드사 자격정보를 전송하고 카드 연동 응답의 data를 반환한다', async () => {
    const responseData: CardLinkResponse = {
      linkId: 'link-id',
      institutionCode: '0301',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [],
    }
    apiClientMocks.post.mockResolvedValue({ data: { success: true, data: responseData } })

    const request = {
      institutionCode: '0301',
      id: 'moca-user',
      password: 'secret',
      cardNo: '1234123412341234',
      cardPassword: '12',
    }

    await expect(createCardLink(request)).resolves.toEqual(responseData)
    expect(apiClientMocks.post).toHaveBeenCalledWith('/api/v1/card-links', request)
  })

  it('기존 연동의 보유카드를 자격정보 없이 재조회한다', async () => {
    const responseData = {
      results: [{ linkId: 'link-id', institutionCode: '0302', success: true, cards: [] }],
    }
    apiClientMocks.post.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(syncCardLinkCards('0302')).resolves.toEqual(responseData)
    expect(apiClientMocks.post).toHaveBeenCalledWith('/api/v1/card-links/cards/sync', undefined, {
      params: { institutionCode: '0302' },
    })
  })

  it('카드사를 생략하면 모든 기존 연동의 보유카드를 재조회한다', async () => {
    const responseData = {
      results: [{ linkId: 'link-id', institutionCode: '0302', success: true, cards: [] }],
    }
    apiClientMocks.post.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(syncCardLinkCards()).resolves.toEqual(responseData)
    expect(apiClientMocks.post).toHaveBeenCalledWith('/api/v1/card-links/cards/sync', undefined, {
      params: undefined,
    })
  })

  it('선택 카드와 옵션을 linkId에 해당하는 활성화 API로 전송한다', async () => {
    const responseData: ActivateCardLinkCardsResponse = {
      linkId: 'link/id',
      activatedUserCardIds: ['user-card-id'],
      activatedCount: 1,
    }
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: responseData } })

    const request = {
      activeUserCardIds: ['user-card-id'],
      optionSelections: [
        {
          userCardId: 'user-card-id',
          optionSelections: [{ optionGroupId: 'benefit-group', optionChoiceId: 'shopping-choice' }],
        },
      ],
    }

    await expect(activateCardLinkCards('link/id', request)).resolves.toEqual(responseData)
    expect(apiClientMocks.patch).toHaveBeenCalledWith('/api/v1/card-links/link%2Fid/cards', request)
  })

  it('카드별 인증정보를 저장한다', async () => {
    const responseData = {
      userCardId: 'user-card-id',
      cardId: 'card-id',
      cardName: '현대카드',
      cardNo: '1234********5678',
      institutionCode: '0302',
      issuerName: '현대카드',
      cardType: 'CREDIT' as const,
      cardImageUrl: null,
      matched: true,
      supported: true,
      optionGroups: [],
    }
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(
      submitCardCredentials('user/card-id', {
        cardNo: '1234567890125678',
        cardPassword: '1234',
      }),
    ).resolves.toEqual(responseData)

    expect(apiClientMocks.patch).toHaveBeenCalledWith(
      '/api/v1/card-links/cards/user%2Fcard-id/credentials',
      { cardNo: '1234567890125678', cardPassword: '1234' },
    )
  })
})
