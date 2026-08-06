import apiClient from '@/shared/api/client'

export interface MyPageSummary {
  connectedCardCount: number
  locationPermissionGranted: boolean
}

interface UpdateNicknameResponse {
  data: {
    nickname: string
  }
}

export async function updateNickname(nickname: string): Promise<string> {
  const response = await apiClient.patch<UpdateNicknameResponse>('/api/v1/me/nickname', {
    nickname,
  })

  return response.data.data.nickname
}

export const MOCK_MYPAGE_SUMMARY: MyPageSummary = {
  connectedCardCount: 3,
  locationPermissionGranted: true,
}

export const MOCK_MYPAGE_SUMMARY_EMPTY: MyPageSummary = {
  connectedCardCount: 0,
  locationPermissionGranted: false,
}

export async function fetchMyPageSummary(): Promise<MyPageSummary> {
  // TODO: 백엔드 연동 시 실제 마이페이지 요약 API 호출로 교체
  await new Promise((resolve) => setTimeout(resolve, 300))
  return { ...MOCK_MYPAGE_SUMMARY }
}

export async function updateLocationPermissionGranted(granted: boolean): Promise<MyPageSummary> {
  // TODO: 백엔드 연동 시 app_user의 위치 기반 서비스 사용 여부 수정 API로 교체
  await new Promise((resolve) => setTimeout(resolve, 300))
  MOCK_MYPAGE_SUMMARY.locationPermissionGranted = granted
  return { ...MOCK_MYPAGE_SUMMARY }
}
