import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn<(url: string) => Promise<unknown>>(),
  requestInterceptorUse: vi.fn<(...args: unknown[]) => void>(),
  responseInterceptorUse: vi.fn<(...args: unknown[]) => void>(),
  authStore: {
    accessToken: null as string | null,
    setAccessToken: vi.fn<(token: string) => void>(),
    clearSession: vi.fn<() => void>(),
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn<() => object>(() => ({
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
    mocks.post.mockReset()
    mocks.authStore.accessToken = null
    mocks.authStore.setAccessToken.mockReset()
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
    const { restoreInitialMocaSession } = await import('../client')

    await expect(restoreInitialMocaSession()).resolves.toBe(true)
    expect(mocks.post).toHaveBeenCalledWith('/api/v1/auth/refresh')
    expect(mocks.authStore.setAccessToken).toHaveBeenCalledWith('refreshed-access-token')
  })
})
