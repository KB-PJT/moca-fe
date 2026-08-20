import apiClient from '@/shared/api/client'

export const FCM_TOKEN_ENDPOINT = '/api/v1/devices'
export const RECENT_LOCATION_ENDPOINT = '/api/v1/users/me/location'

export async function registerFcmToken(token: string): Promise<void> {
  await apiClient.post(FCM_TOKEN_ENDPOINT, {
    fcmToken: token,
    deviceType: 'WEB',
  })
}

export async function updateRecentLocation(latitude: number, longitude: number): Promise<void> {
  await apiClient.put(RECENT_LOCATION_ENDPOINT, { latitude, longitude })
}
