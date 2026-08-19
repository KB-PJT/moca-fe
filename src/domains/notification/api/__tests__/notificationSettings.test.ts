import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import {
  fetchNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from '@/domains/notification/api/notificationSettings'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn<(url: string) => Promise<unknown>>(),
    patch: vi.fn<(url: string, data: NotificationSettings) => Promise<unknown>>(),
  },
}))

const settings: NotificationSettings = {
  performanceClosingEnabled: true,
  nearbyBenefitEnabled: false,
  benefitLimitEnabled: true,
  marketingEnabled: false,
}

describe('notification settings API', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.patch).mockReset()
  })

  it('내 알림 설정을 조회한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: settings } } as never)

    await expect(fetchNotificationSettings()).resolves.toEqual(settings)
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/me/notification-settings')
  })

  it('네 개의 알림 설정을 한 번에 저장한다', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { success: true, data: settings },
    } as never)

    await expect(updateNotificationSettings(settings)).resolves.toEqual(settings)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/me/notification-settings', settings)
  })

  it('알림 설정 조회 오류를 호출자에게 전달한다', async () => {
    const error = new Error('get failed')
    vi.mocked(apiClient.get).mockRejectedValue(error)

    await expect(fetchNotificationSettings()).rejects.toBe(error)
  })

  it('알림 설정 저장 오류를 호출자에게 전달한다', async () => {
    const error = new Error('patch failed')
    vi.mocked(apiClient.patch).mockRejectedValue(error)

    await expect(updateNotificationSettings(settings)).rejects.toBe(error)
  })
})
