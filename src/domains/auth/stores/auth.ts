import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuthUser {
  nickname: string
  email: string
  provider: 'google'
}

export function resolveInitialAccessToken(mode: string, localTestAccessToken?: string) {
  if (mode !== 'development') return null
  return localTestAccessToken?.trim() || null
}

export const useAuthStore = defineStore('auth', () => {
  // 로컬 내장 브라우저에서는 Google OAuth가 차단될 수 있어 개발 모드에서만 고정 테스트 토큰을 쓴다.
  // VITE_LOCAL_TEST_ACCESS_TOKEN은 gitignore 대상인 .env.local에만 두고 DEV 분기 밖에서는 참조하지 않는다.
  const accessToken = ref<string | null>(
    import.meta.env.DEV
      ? resolveInitialAccessToken(
          import.meta.env.MODE,
          import.meta.env.VITE_LOCAL_TEST_ACCESS_TOKEN,
        )
      : null,
  )
  const user = ref<AuthUser | null>(null)

  function setAccessToken(token: string) {
    accessToken.value = token
  }

  function setUser(nextUser: AuthUser) {
    user.value = nextUser
  }

  function clearSession() {
    accessToken.value = null
    user.value = null
  }

  function updateNickname(nickname: string) {
    if (!user.value) return
    user.value = { ...user.value, nickname }
  }

  return {
    accessToken,
    user,
    setAccessToken,
    setUser,
    clearSession,
    updateNickname,
  }
})
