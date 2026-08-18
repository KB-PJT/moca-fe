import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import {
  deleteMocaAccount,
  fetchMyPageSummary,
  updateLocationPermissionGranted,
} from '@/domains/mypage/api/mypage'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn<(url: string) => Promise<unknown>>(),
    patch: vi.fn<(url: string, data: object) => Promise<unknown>>(),
    delete: vi.fn<(url: string, config: object) => Promise<void>>(),
  },
}))

describe('location settings API', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.patch).mockReset()
  })

  it('저장된 위치 추천 설정을 조회한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { locationRecommendationEnabled: true },
      },
    } as never)

    await expect(fetchMyPageSummary()).resolves.toEqual({ locationRecommendationEnabled: true })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/me/location-settings')
  })

  it('위치 추천 설정 조회 실패를 호출자에게 전달한다', async () => {
    const error = new Error('location settings query failed')
    vi.mocked(apiClient.get).mockRejectedValue(error)

    await expect(fetchMyPageSummary()).rejects.toBe(error)
  })

  it.each([true, false])('위치 추천 설정을 %s로 변경한다', async (enabled) => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        success: true,
        data: { locationRecommendationEnabled: enabled },
      },
    } as never)

    await expect(updateLocationPermissionGranted(enabled)).resolves.toEqual({
      locationRecommendationEnabled: enabled,
    })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/me/location-settings', {
      locationRecommendationEnabled: enabled,
    })
  })

  it.each([true, false])('위치 추천 설정 %s 변경 실패를 호출자에게 전달한다', async (enabled) => {
    const error = new Error('location settings update failed')
    vi.mocked(apiClient.patch).mockRejectedValue(error)

    await expect(updateLocationPermissionGranted(enabled)).rejects.toBe(error)
  })
})

describe('deleteMocaAccount', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockReset()
  })

  it.each([
    ['서비스 사용이 불편해요', 'inconvenient'],
    ['필요한 기능이 없어요', 'not_needed'],
    ['혜택 정보가 정확하지 않아요', 'incorrect_benefit'],
    ['개인정보가 걱정돼요', 'privacy_concern'],
    ['사용 빈도가 낮아요', 'low_usage'],
    ['기타', 'etc'],
  ])('화면의 탈퇴 사유 %s를 API 코드 %s로 변환한다', async (reason, reasonCode) => {
    vi.mocked(apiClient.delete).mockResolvedValue({} as never)

    await deleteMocaAccount(reason)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me', {
      data: {
        reason: reasonCode,
        reasonDetail: reason,
        confirmed: true,
      },
    })
  })

  it('사유를 선택하지 않으면 기타 사유로 전송한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({} as never)

    await deleteMocaAccount()

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me', {
      data: {
        reason: 'etc',
        reasonDetail: '선택 안 함',
        confirmed: true,
      },
    })
  })
})
