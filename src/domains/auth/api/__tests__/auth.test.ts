import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import { fetchBenefitPreference, updateBenefitPreference } from '@/domains/auth/api/auth'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn<(url: string) => Promise<unknown>>(),
    patch: vi.fn<(url: string, data: object) => Promise<unknown>>(),
  },
}))

describe('auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('선택한 혜택 선호 성향을 저장한다', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({} as never)

    await updateBenefitPreference('POINT_USAGE')

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/me/benefit-preference', {
      benefitPreferenceType: 'POINT_USAGE',
    })
  })

  it('저장된 혜택 선호 성향을 조회한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { benefitPreferenceType: 'TRAVEL_MILEAGE' },
      },
    } as never)

    await expect(fetchBenefitPreference()).resolves.toBe('TRAVEL_MILEAGE')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/me/benefit-preference')
  })
})
