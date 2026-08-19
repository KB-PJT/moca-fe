import apiClient from '@/shared/api/client'

export interface NotificationSettings {
  performanceClosingEnabled: boolean
  nearbyBenefitEnabled: boolean
  benefitLimitEnabled: boolean
  marketingEnabled: boolean
}

interface NotificationSettingsResponse {
  success: boolean
  data: NotificationSettings
}

const NOTIFICATION_SETTINGS_ENDPOINT = '/api/v1/me/notification-settings'

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiClient.get<NotificationSettingsResponse>(NOTIFICATION_SETTINGS_ENDPOINT)

  return response.data.data
}

export async function updateNotificationSettings(
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  const response = await apiClient.patch<NotificationSettingsResponse>(
    NOTIFICATION_SETTINGS_ENDPOINT,
    settings,
  )

  return response.data.data
}
