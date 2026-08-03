export interface MyPageSummary {
  connectedCardCount: number
  lastSyncedAt: string
  locationPermissionGranted: boolean
}

export const MOCK_MYPAGE_SUMMARY: MyPageSummary = {
  connectedCardCount: 3,
  lastSyncedAt: '오늘 10:24',
  locationPermissionGranted: true,
}

export const MOCK_MYPAGE_SUMMARY_EMPTY: MyPageSummary = {
  connectedCardCount: 0,
  lastSyncedAt: '',
  locationPermissionGranted: false,
}

export async function fetchMyPageSummary(): Promise<MyPageSummary> {
  // TODO: 백엔드 연동 시 실제 마이페이지 요약 API 호출로 교체
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_MYPAGE_SUMMARY
}

export async function updateLocationPermissionGranted(granted: boolean): Promise<MyPageSummary> {
  // TODO: 백엔드 연동 시 app_user의 위치 기반 서비스 사용 여부 수정 API로 교체
  await new Promise((resolve) => setTimeout(resolve, 300))
  MOCK_MYPAGE_SUMMARY.locationPermissionGranted = granted
  return { ...MOCK_MYPAGE_SUMMARY }
}
