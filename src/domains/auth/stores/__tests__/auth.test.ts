import { describe, expect, it } from 'vitest'
import { resolveInitialAccessToken } from '@/domains/auth/stores/auth'

describe('auth store', () => {
  it('개발 모드에서만 로컬 테스트 토큰을 초기값으로 사용한다', () => {
    expect(resolveInitialAccessToken('development', ' local-token ')).toBe('local-token')
    expect(resolveInitialAccessToken('test', 'local-token')).toBeNull()
    expect(resolveInitialAccessToken('production', 'local-token')).toBeNull()
  })

  it('개발 모드여도 로컬 테스트 토큰이 비어 있으면 인증되지 않은 상태로 시작한다', () => {
    expect(resolveInitialAccessToken('development')).toBeNull()
    expect(resolveInitialAccessToken('development', '   ')).toBeNull()
  })
})
