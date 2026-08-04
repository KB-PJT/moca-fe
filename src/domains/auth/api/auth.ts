import apiClient from '@/shared/api/client'

interface MocaLoginResponse {
  data: {
    accessToken: string
  }
}

export async function loginToMoca(code: string, codeVerifier: string): Promise<MocaLoginResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/google/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code, codeVerifier }),
  })

  if (!response.ok) {
    throw new Error('MOCA 로그인에 실패했습니다.')
  }

  return response.json() as Promise<MocaLoginResponse>
}

export async function logoutFromMoca(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}
