import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deactivateMyCard,
  disconnectMyCard,
  fetchMyCards,
  reorderMyCards,
  type MyCardsResponse,
} from '../cardManagement'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config?: unknown) => Promise<unknown>>(),
  patch: vi.fn<(url: string, data?: unknown) => Promise<unknown>>(),
  delete: vi.fn<(url: string) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({
  default: apiClientMocks,
}))

describe('cardManagement API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('비활성 카드를 포함해 내 카드 목록을 조회한다', async () => {
    const responseData: MyCardsResponse = {
      lastSyncedAt: '2026-08-07T10:30:00+09:00',
      activeCards: [],
      inactiveCards: [],
    }
    apiClientMocks.get.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(fetchMyCards()).resolves.toEqual(responseData)
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/me/cards', {
      params: { includeInactive: false },
    })
  })

  it('선택한 보유 카드를 비활성화한다', async () => {
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: { success: true } } })

    await expect(deactivateMyCard('card/id')).resolves.toBeUndefined()

    expect(apiClientMocks.patch).toHaveBeenCalledWith('/api/v1/me/cards/card%2Fid/deactivate')
  })

  it('카드 비활성화 응답 본문이 실패이면 예외를 발생시킨다', async () => {
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: { success: false } } })

    await expect(deactivateMyCard('card-id')).rejects.toThrow('CARD_DEACTIVATION_FAILED')
  })

  it('활성 보유 카드 전체의 표시 순서를 변경한다', async () => {
    const responseData: MyCardsResponse = {
      lastSyncedAt: '2026-08-07T10:30:00+09:00',
      activeCards: [],
      inactiveCards: [],
    }
    apiClientMocks.patch.mockResolvedValue({ data: { success: true, data: responseData } })

    await expect(reorderMyCards(['card-2', 'card-1'])).resolves.toEqual(responseData)
    expect(apiClientMocks.patch).toHaveBeenCalledWith('/api/v1/me/cards/order', {
      userCardIds: ['card-2', 'card-1'],
    })
  })

  it('선택한 보유 카드의 연결을 해제한다', async () => {
    apiClientMocks.delete.mockResolvedValue({ data: { success: true, data: { success: true } } })

    await expect(disconnectMyCard('card/id')).resolves.toBeUndefined()

    expect(apiClientMocks.delete).toHaveBeenCalledWith('/api/v1/me/cards/card%2Fid')
  })

  it('카드 연결 해제 응답 본문이 실패이면 예외를 발생시킨다', async () => {
    apiClientMocks.delete.mockResolvedValue({ data: { success: true, data: { success: false } } })

    await expect(disconnectMyCard('card-id')).rejects.toThrow('CARD_DISCONNECTION_FAILED')
  })
})
