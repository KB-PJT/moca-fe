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

const DELETE_ACCOUNT_REASON_CODES: Record<string, string> = {
  '서비스 사용이 불편해요': 'inconvenient',
  '필요한 기능이 없어요': 'missing_features',
  '혜택 정보가 정확하지 않아요': 'inaccurate_benefits',
  '개인정보가 걱정돼요': 'privacy_concerns',
  '사용 빈도가 낮아요': 'low_usage',
  기타: 'other',
}

export async function deleteMocaAccount(reason?: string): Promise<void> {
  await apiClient.delete('/api/v1/me', {
    data: {
      reason: reason ? DELETE_ACCOUNT_REASON_CODES[reason] : 'other',
      reasonDetail: reason ?? '선택 안 함',
      confirmed: true,
    },
  })
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
