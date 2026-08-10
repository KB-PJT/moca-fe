import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardDetailResponse } from '@/domains/card/api/cardDetail'
import { fetchCardDetail, updateCardMemo } from '@/domains/card/api/cardDetail'
import type { MyCardItemResponse } from '@/domains/card/api/cardManagement'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
  patch: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

describe('cardDetail API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('보유 카드 상세정보를 조회한다', async () => {
    const responseData: CardDetailResponse = {
      userCardId: 'user/card-id',
      cardName: 'KB My WE:SH',
      cardNo: '123456******4321',
      issuerId: 'issuer-id',
      issuerName: 'KB국민카드',
      cardImageUrl: null,
      memo: '카페 결제용',
      benefits: [],
      notices: [],
    }
    apiClientMocks.get.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(fetchCardDetail('user/card-id')).resolves.toEqual(responseData)
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/me/cards/user%2Fcard-id')
  })

  it('카드 메모를 수정한다', async () => {
    const responseData: MyCardItemResponse = {
      userCardId: 'user/card-id',
      cardName: 'KB My WE:SH',
      cardNo: '123456******4321',
      issuerId: 'issuer-id',
      issuerName: 'KB국민카드',
      cardImageUrl: null,
      memo: '주말 카페 결제용',
    }
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(updateCardMemo('user/card-id', responseData.memo)).resolves.toEqual(responseData)
    expect(apiClientMocks.patch).toHaveBeenCalledWith('/api/v1/me/cards/user%2Fcard-id/memo', {
      memo: '주말 카페 결제용',
    })
  })
})
