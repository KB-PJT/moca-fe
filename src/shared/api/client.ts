import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { API_BASE_URL } from '@/shared/api/baseUrl'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshTokenResponse {
  data: {
    accessToken: string
  }
}

interface MyProfileResponse {
  data: {
    email: string | null
    nickname: string
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore().accessToken

  if (accessToken && config.url !== '/api/v1/auth/refresh') {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

let refreshPromise: Promise<string> | undefined

function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = apiClient
    .post<RefreshTokenResponse>('/api/v1/auth/refresh')
    .then(({ data }) => {
      const accessToken = data.data.accessToken
      useAuthStore().setAccessToken(accessToken)

      return accessToken
    })
    .finally(() => {
      refreshPromise = undefined
    })

  return refreshPromise
}

async function restoreCurrentUser(): Promise<void> {
  const response = await apiClient.get<MyProfileResponse>('/api/v1/me')

  useAuthStore().setUser({
    nickname: response.data.data.nickname,
    email: response.data.data.email ?? '',
    provider: 'google',
  })
}

export async function restoreMocaSession(): Promise<boolean> {
  try {
    await refreshAccessToken()
    // 라우터 가드는 accessToken 유무만으로 리다이렉트를 결정하므로, 화면 렌더를 막지
    // 않도록 프로필 조회는 백그라운드로 돌린다. 실패해도 유효한 토큰 자체는 살아있어야
    // 하므로 세션을 지우지 않는다.
    void restoreCurrentUser().catch(() => {})
    return true
  } catch {
    useAuthStore().clearSession()
    return false
  }
}

let initialSessionRestorePromise: Promise<boolean> | undefined

export function restoreInitialMocaSession(): Promise<boolean> {
  if (useAuthStore().accessToken) {
    return Promise.resolve(true)
  }

  if (!initialSessionRestorePromise) {
    initialSessionRestorePromise = restoreMocaSession()
  }

  return initialSessionRestorePromise
}

function isAuthRequest(url: string | undefined): boolean {
  return Boolean(url?.startsWith('/api/v1/auth/'))
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest(request.url)
    ) {
      return Promise.reject(error)
    }

    request._retry = true

    try {
      const accessToken = await refreshAccessToken()
      request.headers.Authorization = `Bearer ${accessToken}`

      return apiClient(request)
    } catch {
      useAuthStore().clearSession()
      return Promise.reject(error)
    }
  },
)

export default apiClient
