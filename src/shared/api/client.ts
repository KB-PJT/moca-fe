import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/domains/auth/stores/auth'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshTokenResponse {
  data: {
    accessToken: string
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore().accessToken

  if (accessToken) {
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
