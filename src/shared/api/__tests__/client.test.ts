import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
  post: vi.fn<(url: string) => Promise<unknown>>(),
  requestInterceptorUse: vi.fn<(...args: unknown[]) => void>(),
  responseInterceptorUse: vi.fn<(...args: unknown[]) => void>(),
  authStore: {
    accessToken: null as string | null,
    setAccessToken: vi.fn<(token: string) => void>(),
    setUser: vi.fn<(user: { nickname: string; email: string; provider: 'google' }) => void>(),
    clearSession: vi.fn<() => void>(),
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn<() => object>(() => ({
      get: mocks.get,
      post: mocks.post,
      interceptors: {
        request: { use: mocks.requestInterceptorUse },
        response: { use: mocks.responseInterceptorUse },
      },
    })),
  },
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

describe('restoreInitialMocaSession', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.authStore.accessToken = null
    mocks.authStore.setAccessToken.mockReset()
    mocks.authStore.setUser.mockReset()
    mocks.authStore.clearSession.mockReset()
  })

  it('이미 access token이 있으면 refresh 요청을 생략한다', async () => {
    mocks.authStore.accessToken = 'issued-access-token'
    const { restoreInitialMocaSession } = await import('../client')

    await expect(restoreInitialMocaSession()).resolves.toBe(true)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.authStore.clearSession).not.toHaveBeenCalled()
  })

  it('access token이 없으면 refresh로 초기 세션을 복구한다', async () => {
    mocks.post.mockResolvedValue({
      data: {
        data: { accessToken: 'refreshed-access-token' },
      },
    })
    mocks.get.mockResolvedValue({
      data: {
        data: {
          nickname: '모카',
          email: 'moca@example.com',
        },
      },
    })
    const { restoreInitialMocaSession } = await import('../client')

    await expect(restoreInitialMocaSession()).resolves.toBe(true)
    expect(mocks.post).toHaveBeenCalledWith('/api/v1/auth/refresh')
    expect(mocks.authStore.setAccessToken).toHaveBeenCalledWith('refreshed-access-token')
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/me')
    expect(mocks.authStore.setUser).toHaveBeenCalledWith({
      nickname: '모카',
      email: 'moca@example.com',
      provider: 'google',
    })
  })
})
