import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHomeGreeting, type HomeGreetingResponse } from '@/domains/home/api/homeGreeting'

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
}))

vi.mock('@/shared/api/client', () => ({ default: apiClientMocks }))

describe('homeGreeting API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('홈 인사와 놓친 혜택 데이터를 반환한다', async () => {
    const greeting: HomeGreetingResponse = {
      nickname: '지민',
      yearMonth: '2026-08',
      missedBenefitAmount: 8_200,
      message: '이번 달 혜택 8,200원을 놓치고 있어요!',
    }
    apiClientMocks.get.mockResolvedValue({ data: { success: true, data: greeting } })

    await expect(fetchHomeGreeting()).resolves.toEqual(greeting)
    expect(apiClientMocks.get).toHaveBeenCalledWith('/api/v1/home/greeting')
  })
})
