import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMyCards, type MyCardsResponse } from '../cardManagement'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config?: unknown) => Promise<unknown>>(),
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
})
