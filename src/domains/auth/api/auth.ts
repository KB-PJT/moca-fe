import apiClient from '@/shared/api/client'

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

export async function loginToMoca(code: string, codeVerifier: string): Promise<MocaLoginResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/google/login`, {
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

export async function logoutFromMoca(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}
