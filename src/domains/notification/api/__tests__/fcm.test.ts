import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import {
  FCM_TOKEN_ENDPOINT,
  RECENT_LOCATION_ENDPOINT,
  registerFcmToken,
  updateRecentLocation,
} from '@/domains/notification/api/fcm'

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
    put: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
  },
}))

describe('FCM API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('웹 FCM 토큰을 등록한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({} as never)

    await registerFcmToken('fcm-token')

    expect(FCM_TOKEN_ENDPOINT).toBe('/api/v1/devices')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/devices', {
      fcmToken: 'fcm-token',
      deviceType: 'WEB',
    })
  })

  it('최근 위치를 백엔드에 갱신한다', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({} as never)

    await updateRecentLocation(35.123456, 129.123456)

    expect(RECENT_LOCATION_ENDPOINT).toBe('/api/v1/users/me/location')
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/users/me/location', {
      latitude: 35.123456,
      longitude: 129.123456,
    })
  })
})
