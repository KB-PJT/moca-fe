import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function createAuthStore() {
  const { useAuthStore } = await import('@/domains/auth/stores/auth')
  return useAuthStore(createPinia())
}

describe('auth store', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('개발 모드에서 trim한 로컬 테스트 토큰으로 시작한다', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_LOCAL_TEST_ACCESS_TOKEN', ' local-token ')

    const authStore = await createAuthStore()

    expect(authStore.accessToken).toBe('local-token')
  })

  it('개발 모드여도 로컬 테스트 토큰이 비어 있으면 인증되지 않은 상태로 시작한다', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_LOCAL_TEST_ACCESS_TOKEN', '   ')

    const authStore = await createAuthStore()

    expect(authStore.accessToken).toBeNull()
  })

  it('개발 서버여도 Vite mode가 development가 아니면 테스트 토큰을 사용하지 않는다', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('MODE', 'staging')
    vi.stubEnv('VITE_LOCAL_TEST_ACCESS_TOKEN', 'local-token')

    const authStore = await createAuthStore()

    expect(authStore.accessToken).toBeNull()
  })
})
