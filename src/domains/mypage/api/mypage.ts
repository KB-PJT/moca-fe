import apiClient from '@/shared/api/client'

export interface MyPageSummary {
  locationRecommendationEnabled: boolean
}

interface UpdateNicknameResponse {
  data: {
    nickname: string
  }
}

interface LocationSettingsApiResponse {
  success: true
  data: {
    locationRecommendationEnabled: boolean
  }
}

export async function updateNickname(nickname: string): Promise<string> {
  const response = await apiClient.patch<UpdateNicknameResponse>('/api/v1/me/nickname', {
    nickname,
  })

  return response.data.data.nickname
}

const DELETE_ACCOUNT_REASON_CODES: Record<string, string> = {
  '서비스 사용이 불편해요': 'inconvenient',
  '필요한 기능이 없어요': 'not_needed',
  '혜택 정보가 정확하지 않아요': 'incorrect_benefit',
  '개인정보가 걱정돼요': 'privacy_concern',
  '사용 빈도가 낮아요': 'low_usage',
  기타: 'etc',
}

export async function deleteMocaAccount(reason?: string): Promise<void> {
  await apiClient.delete('/api/v1/me', {
    data: {
      reason: reason ? DELETE_ACCOUNT_REASON_CODES[reason] : 'etc',
      reasonDetail: reason ?? '선택 안 함',
      confirmed: true,
    },
  })
}

export async function fetchMyPageSummary(): Promise<MyPageSummary> {
  const response = await apiClient.get<LocationSettingsApiResponse>('/api/v1/me/location-settings')

  return {
    locationRecommendationEnabled: response.data.data.locationRecommendationEnabled,
  }
}

export async function updateLocationPermissionGranted(granted: boolean): Promise<MyPageSummary> {
  const response = await apiClient.patch<LocationSettingsApiResponse>(
    '/api/v1/me/location-settings',
    { locationRecommendationEnabled: granted },
  )

  return {
    locationRecommendationEnabled: response.data.data.locationRecommendationEnabled,
  }
}
