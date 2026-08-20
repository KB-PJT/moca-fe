import apiClient from '@/shared/api/client'
import { API_BASE_URL } from '@/shared/api/baseUrl'

interface MocaLoginResponse {
  data: {
    accessToken: string
    member: {
      cardSortMode: string
      email: string
      nickname: string
      userId: string
      userType: string
    }
  }
}

interface OnboardingStatusResponse {
  data: {
    newUser: boolean
  }
}

interface BenefitPreferenceResponse {
  data: {
    benefitPreferenceType: BenefitPreferenceType
  }
}

export type BenefitPreferenceType =
  | 'IMMEDIATE_SAVINGS'
  | 'POINT_USAGE'
  | 'TRAVEL_MILEAGE'
  | 'MAXIMUM_BENEFIT'

export async function loginToMoca(code: string, codeVerifier: string): Promise<MocaLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/google/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      code,
      codeVerifier,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    throw new Error('MOCA 로그인에 실패했습니다.')
  }

  return response.json() as Promise<MocaLoginResponse>
}

export async function fetchOnboardingStatus(): Promise<boolean> {
  const response = await apiClient.get<OnboardingStatusResponse>('/api/v1/me/onboarding-status')

  return response.data.data.newUser
}

export async function fetchBenefitPreference(): Promise<BenefitPreferenceType> {
  const response = await apiClient.get<BenefitPreferenceResponse>('/api/v1/me/benefit-preference')

  return response.data.data.benefitPreferenceType
}

export async function updateBenefitPreference(
  benefitPreferenceType: BenefitPreferenceType,
): Promise<void> {
  await apiClient.patch('/api/v1/me/benefit-preference', { benefitPreferenceType })
}

export async function logoutFromMoca(fcmToken?: string | null): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', fcmToken ? { fcmToken } : undefined)
}
