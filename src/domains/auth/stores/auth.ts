import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuthUser {
  nickname: string
  email: string
  provider: 'google'
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
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
