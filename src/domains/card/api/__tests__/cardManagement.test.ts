import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deactivateMyCard,
  disconnectMyCard,
  fetchMyCards,
  type MyCardsResponse,
} from '../cardManagement'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config?: unknown) => Promise<unknown>>(),
  patch: vi.fn<(url: string) => Promise<unknown>>(),
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

  it('선택한 보유 카드의 연결을 해제한다', async () => {
    apiClientMocks.delete.mockResolvedValue({ data: { success: true, data: { success: true } } })

    await expect(disconnectMyCard('card/id')).resolves.toBeUndefined()

    expect(apiClientMocks.delete).toHaveBeenCalledWith('/api/v1/me/cards/card%2Fid')
  })
})
